import request from "supertest";
import { when } from "jest-when";
import { logger } from "@stela/logger";
import { app } from "../app";
import { verifyUserAuthentication } from "../middleware";
import { db } from "../database";
import { GB } from "../constants";
import { sendInvitationNotification, sendGiftNotification } from "../email";
import { mockVerifyUserAuthentication } from "../../test/middleware_mocks";

jest.mock("../database");
jest.mock("../middleware");
jest.mock("../email");
jest.mock("@stela/logger");

interface AccountSpace {
	spaceLeft: string;
	spaceTotal: string;
}

const senderAccountId = "2";
const recipientOneAccountId = "3";
const recipientTwoAccountId = "4";

const clearDatabase = async (): Promise<void> => {
	await db.query(
		"TRUNCATE account, account_space, ledger_financial, email, invite CASCADE",
	);
};

const getAccountSpace = async (
	accountId: string,
): Promise<AccountSpace | undefined> => {
	const result = await db.query<AccountSpace>(
		'SELECT spaceLeft "spaceLeft", spaceTotal "spaceTotal" FROM account_space WHERE accountId = :accountId',
		{ accountId },
	);
	return result.rows[0];
};

const checkLedgerEntries = async (giftData: {
	gifterAccountId: string;
	recipientAccountId: string;
	amountInGB: number;
	initialSenderSpace: AccountSpace | undefined;
	initialRecipientSpace: AccountSpace | undefined;
}): Promise<void> => {
	const ledgerEntryResponse = await db.query<{
		spaceDelta: string;
		fromSpaceBefore: string;
		fromSpaceLeft: string;
		fromSpaceTotal: string;
		toSpaceBefore: string;
		toSpaceLeft: string;
		toSpaceTotal: string;
	}>(
		`SELECT
      spaceDelta "spaceDelta",
      fromSpaceBefore "fromSpaceBefore",
      fromSpaceLeft "fromSpaceLeft",
      fromSpaceTotal "fromSpaceTotal",
      toSpaceBefore "toSpaceBefore",
      toSpaceLeft "toSpaceLeft",
      toSpaceTotal "toSpaceTotal"
    FROM
      ledger_financial
    WHERE
      fromAccountId = :senderAccountId
      AND toAccountId = :recipientAccountId`,
		{
			senderAccountId: giftData.gifterAccountId,
			recipientAccountId: giftData.recipientAccountId,
		},
	);

	ledgerEntryResponse.rows.forEach((ledgerEntry) => {
		expect(ledgerEntry.spaceDelta).toBe((giftData.amountInGB * GB).toString());

		if (
			giftData.initialSenderSpace?.spaceTotal === undefined ||
			giftData.initialRecipientSpace?.spaceTotal === undefined
		) {
			expect(true).toBe(false);
		} else {
			// In the event of multiple recipients, we can't know precisely how much space the sender had before each gift
			// so we check that it's less than or equal to the initial space total and that it's decreased in increments
			// equal to the gift size
			expect(+ledgerEntry.fromSpaceBefore).toBeLessThanOrEqual(
				+giftData.initialSenderSpace.spaceTotal,
			);
			expect(
				(+giftData.initialSenderSpace.spaceTotal -
					+ledgerEntry.fromSpaceBefore) %
					(giftData.amountInGB * GB),
			).toStrictEqual(0);
			expect(+ledgerEntry.fromSpaceLeft).toBe(
				+ledgerEntry.fromSpaceBefore - giftData.amountInGB * GB,
			);
			expect(+ledgerEntry.fromSpaceTotal).toBe(
				+ledgerEntry.fromSpaceBefore - giftData.amountInGB * GB,
			);

			if (giftData.recipientAccountId === "0") {
				expect(+ledgerEntry.toSpaceBefore).toBe(0);
				expect(+ledgerEntry.toSpaceLeft).toBe(0);
				expect(+ledgerEntry.toSpaceTotal).toBe(0);
			} else {
				expect(ledgerEntry.toSpaceBefore).toBe(
					giftData.initialRecipientSpace.spaceTotal,
				);
				expect(+ledgerEntry.toSpaceLeft).toBe(
					+giftData.initialRecipientSpace.spaceTotal + giftData.amountInGB * GB,
				);
				expect(+ledgerEntry.toSpaceTotal).toBe(
					+giftData.initialRecipientSpace.spaceTotal + giftData.amountInGB * GB,
				);
			}
		}
	});
};

describe("/billing/gift", () => {
	const agent = request(app);

	beforeEach(async () => {
		mockVerifyUserAuthentication(
			"test@permanent.org",
			"13bb917e-7c75-4971-a8ee-b22e82432888",
		);
		await clearDatabase();
	});

	afterEach(async () => {
		await clearDatabase();
		jest.clearAllMocks();
	});

	test("should call verifyUserAuthentication", async () => {
		await agent.post("/api/v2/billing/gift");
		expect(verifyUserAuthentication).toHaveBeenCalled();
	});

	test("should return invalid request status if email from auth token is missing", async () => {
		mockVerifyUserAuthentication(
			undefined,
			"13bb917e-7c75-4971-a8ee-b22e82432888",
		);
		await agent.post("/api/v2/billing/gift").expect(400);
	});

	test("should return invalid request status if email from auth token is not an email", async () => {
		mockVerifyUserAuthentication(
			"test",
			"13bb917e-7c75-4971-a8ee-b22e82432888",
		);
		await agent.post("/api/v2/billing/gift").expect(400);
	});

	test("should return invalid request status if subject from auth token is missing", async () => {
		mockVerifyUserAuthentication("test@permanent.org");
		await agent.post("/api/v2/billing/gift").expect(400);
	});

	test("should return invalid request status if subject from auth token is not a uuid", async () => {
		mockVerifyUserAuthentication("test@permanent.org", "not_a_uuid");
		await agent.post("/api/v2/billing/gift").expect(400);
	});

	test("should return invalid request status if storage amount is missing", async () => {
		await agent
			.post("/api/v2/billing/gift")
			.send({ recipientEmails: ["test+recipient@permanent.org"] })
			.expect(400);
	});

	test("should return invalid request status if storage amount is wrong type", async () => {
		await agent
			.post("/api/v2/billing/gift")
			.send({
				storageAmount: "test",
				recipientEmails: ["test+recipient@permanent.org"],
			})
			.expect(400);
	});

	test("should return invalid request status if storage amount is non-integer", async () => {
		await agent
			.post("/api/v2/billing/gift")
			.send({
				storageAmount: 1.5,
				recipientEmails: ["test+recipient@permanent.org"],
			})
			.expect(400);
	});

	test("should return invalid request status if storage amount is less than 1", async () => {
		await agent
			.post("/api/v2/billing/gift")
			.send({
				storageAmount: 0,
				recipientEmails: ["test+recipient@permanent.org"],
			})
			.expect(400);
	});

	test("should return invalid request status if recipient emails is missing", async () => {
		await agent
			.post("/api/v2/billing/gift")
			.send({ storageAmount: 1 })
			.expect(400);
	});

	test("should return invalid request status if recipient emails is not an array", async () => {
		await agent
			.post("/api/v2/billing/gift")
			.send({ storageAmount: 1, recipientEmails: "test" })
			.expect(400);
	});

	test("should return invalid request status if recipient emails is empty", async () => {
		await agent
			.post("/api/v2/billing/gift")
			.send({ storageAmount: 1, recipientEmails: [] })
			.expect(400);
	});

	test("should return invalid request status if recipient emails contains non-email items", async () => {
		await agent
			.post("/api/v2/billing/gift")
			.send({
				storageAmount: 1,
				recipientEmails: ["test+recipient@permanent.org", "test"],
			})
			.expect(400);
	});

	test("should return invalid request status if note is wrong type", async () => {
		await agent
			.post("/api/v2/billing/gift")
			.send({
				storageAmount: 1,
				recipientEmails: ["test+recipient@permanent.org"],
				note: 1,
			})
			.expect(400);
	});

	test("should return a 500 error if email from auth token has no permanent account", async () => {
		await db.sql("billing.fixtures.create_test_accounts");
		await db.sql("billing.fixtures.create_test_account_space");
		await db.sql("billing.fixtures.create_test_emails");
		mockVerifyUserAuthentication(
			"not_a_user@permanent.org",
			"13bb917e-7c75-4971-a8ee-b22e82432888",
		);

		await agent
			.post("/api/v2/billing/gift")
			.send({
				storageAmount: 1,
				recipientEmails: ["test+1@permanent.org"],
			})
			.expect(500);
	});

	test("should create a ledger entry with correct values if recipient already has an account", async () => {
		await db.sql("billing.fixtures.create_test_accounts");
		await db.sql("billing.fixtures.create_test_account_space");
		await db.sql("billing.fixtures.create_test_emails");

		const initialSenderSpace = await getAccountSpace(senderAccountId);
		const initialRecipientSpace = await getAccountSpace(recipientOneAccountId);
		await agent
			.post("/api/v2/billing/gift")
			.send({ storageAmount: 1, recipientEmails: ["test+1@permanent.org"] })
			.expect(200);
		await checkLedgerEntries({
			gifterAccountId: senderAccountId,
			recipientAccountId: recipientOneAccountId,
			amountInGB: 1,
			initialSenderSpace,
			initialRecipientSpace,
		});
	});

	test("successful gift should update account_space for sender", async () => {
		await db.sql("billing.fixtures.create_test_accounts");
		await db.sql("billing.fixtures.create_test_account_space");
		await db.sql("billing.fixtures.create_test_emails");

		const initialAccountSpace = await getAccountSpace(senderAccountId);
		await agent
			.post("/api/v2/billing/gift")
			.send({ storageAmount: 1, recipientEmails: ["test+1@permanent.org"] })
			.expect(200);
		const updatedAccountSpace = await getAccountSpace(senderAccountId);
		if (
			initialAccountSpace?.spaceLeft === undefined ||
			updatedAccountSpace?.spaceLeft === undefined
		) {
			expect(false).toBe(true);
		} else {
			expect(+updatedAccountSpace.spaceLeft).toBe(
				+initialAccountSpace.spaceLeft - GB,
			);
		}
		if (
			initialAccountSpace?.spaceTotal === undefined ||
			updatedAccountSpace?.spaceTotal === undefined
		) {
			expect(false).toBe(true);
		} else {
			expect(+updatedAccountSpace.spaceTotal).toBe(
				+initialAccountSpace.spaceTotal - GB,
			);
		}
	});

	test("successful gift should update account_space for recipient", async () => {
		await db.sql("billing.fixtures.create_test_accounts");
		await db.sql("billing.fixtures.create_test_emails");
		await db.sql("billing.fixtures.create_test_account_space");
		const initialAccountSpace = await getAccountSpace(recipientOneAccountId);
		await agent
			.post("/api/v2/billing/gift")
			.send({ storageAmount: 1, recipientEmails: ["test+1@permanent.org"] })
			.expect(200);
		const updatedAccountSpace = await getAccountSpace(recipientOneAccountId);
		if (
			initialAccountSpace?.spaceLeft === undefined ||
			updatedAccountSpace?.spaceLeft === undefined
		) {
			expect(false).toBe(true);
		} else {
			expect(+updatedAccountSpace.spaceLeft).toBe(
				+initialAccountSpace.spaceLeft + GB,
			);
		}
		if (
			initialAccountSpace?.spaceTotal === undefined ||
			updatedAccountSpace?.spaceTotal === undefined
		) {
			expect(false).toBe(true);
		} else {
			expect(+updatedAccountSpace.spaceTotal).toBe(
				+initialAccountSpace.spaceTotal + GB,
			);
		}
	});

	test("should create a multiple correct ledger entries if there are multiple recipients", async () => {
		await db.sql("billing.fixtures.create_test_accounts");
		await db.sql("billing.fixtures.create_test_account_space");
		await db.sql("billing.fixtures.create_test_emails");

		const initialSenderSpace = await getAccountSpace(senderAccountId);
		const initialRecipientOneSpace = await getAccountSpace(
			recipientOneAccountId,
		);
		const initialRecipientTwoSpace = await getAccountSpace(
			recipientTwoAccountId,
		);
		await agent
			.post("/api/v2/billing/gift")
			.send({
				storageAmount: 1,
				recipientEmails: ["test+1@permanent.org", "test+2@permanent.org"],
			})
			.expect(200);
		await checkLedgerEntries({
			gifterAccountId: senderAccountId,
			recipientAccountId: recipientOneAccountId,
			amountInGB: 1,
			initialSenderSpace,
			initialRecipientSpace: initialRecipientOneSpace,
		});
		await checkLedgerEntries({
			gifterAccountId: senderAccountId,
			recipientAccountId: recipientTwoAccountId,
			amountInGB: 1,
			initialSenderSpace,
			initialRecipientSpace: initialRecipientTwoSpace,
		});
	});

	test("should return an invalid request status if sender doesn't have enough storage", async () => {
		await db.sql("billing.fixtures.create_test_accounts");
		await db.sql("billing.fixtures.create_test_account_space");
		await db.sql("billing.fixtures.create_test_emails");

		await agent
			.post("/api/v2/billing/gift")
			.send({
				storageAmount: 5,
				recipientEmails: ["test+1@permanent.org"],
			})
			.expect(400);
	});

	test("should create an invite if recipient doesn't have an account", async () => {
		await db.sql("billing.fixtures.create_test_accounts");
		await db.sql("billing.fixtures.create_test_account_space");
		await db.sql("billing.fixtures.create_test_emails");

		const newUserEmails = [
			"test+not_a_user_yet@permanent.org",
			"test+also_not_a_user_yet@permanent.org",
		];

		await agent
			.post("/api/v2/billing/gift")
			.send({
				storageAmount: 1,
				recipientEmails: newUserEmails,
			})
			.expect(200);

		const inviteResponse = await db.query<{ inviteId: string; token: string }>(
			"SELECT inviteId, token FROM invite WHERE email = ANY(:newUserEmails) AND byAccountId = :senderAccountId",
			{ newUserEmails, senderAccountId },
		);
		expect(inviteResponse.rows.length).toBe(2);
		expect(inviteResponse.rows[0]?.token).not.toBe(
			inviteResponse.rows[1]?.token,
		);
	});

	test("should not create an invite if recipient already has an invite", async () => {
		await db.sql("billing.fixtures.create_test_accounts");
		await db.sql("billing.fixtures.create_test_account_space");
		await db.sql("billing.fixtures.create_test_emails");
		await db.sql("billing.fixtures.create_test_invites");

		const newUserEmails = ["test+already_invited@permanent.org"];

		await agent
			.post("/api/v2/billing/gift")
			.send({
				storageAmount: 1,
				recipientEmails: newUserEmails,
			})
			.expect(200);

		const inviteResponse = await db.query<{ inviteId: string }>(
			"SELECT inviteId FROM invite WHERE email = ANY(:newUserEmails) AND byAccountId = :senderAccountId",
			{ newUserEmails, senderAccountId },
		);
		expect(inviteResponse.rows.length).toBe(0);
	});

	test("should create a gift purchase ledger entry if recipient doesn't have an account", async () => {
		await db.sql("billing.fixtures.create_test_accounts");
		await db.sql("billing.fixtures.create_test_account_space");
		await db.sql("billing.fixtures.create_test_emails");

		const initialSenderSpace = await getAccountSpace(senderAccountId);

		const newUserEmails = [
			"test+not_a_user_yet@permanent.org",
			"test+also_not_a_user_yet@permanent.org",
		];

		await agent
			.post("/api/v2/billing/gift")
			.send({
				storageAmount: 1,
				recipientEmails: newUserEmails,
			})
			.expect(200);

		await checkLedgerEntries({
			gifterAccountId: senderAccountId,
			recipientAccountId: "0",
			amountInGB: 1,
			initialSenderSpace,
			initialRecipientSpace: {
				spaceLeft: "0",
				spaceTotal: "0",
			},
		});
	});

	test("should send invitation email if recipient doesn't have an account", async () => {
		await db.sql("billing.fixtures.create_test_accounts");
		await db.sql("billing.fixtures.create_test_account_space");
		await db.sql("billing.fixtures.create_test_emails");

		const newUserEmails = [
			"test+not_a_user_yet@permanent.org",
			"test+also_not_a_user_yet@permanent.org",
		];

		await agent
			.post("/api/v2/billing/gift")
			.send({
				storageAmount: 1,
				recipientEmails: newUserEmails,
			})
			.expect(200);

		expect(sendInvitationNotification).toHaveBeenCalledTimes(2);
	});

	test("should send gift notification email if recipient does have an account", async () => {
		await db.sql("billing.fixtures.create_test_accounts");
		await db.sql("billing.fixtures.create_test_account_space");
		await db.sql("billing.fixtures.create_test_emails");

		const newUserEmails = ["test+1@permanent.org"];

		await agent
			.post("/api/v2/billing/gift")
			.send({
				storageAmount: 1,
				recipientEmails: newUserEmails,
			})
			.expect(200);

		expect(sendGiftNotification).toHaveBeenCalledTimes(1);
	});

	test("should report what happened to each email passed in", async () => {
		await db.sql("billing.fixtures.create_test_accounts");
		await db.sql("billing.fixtures.create_test_account_space");
		await db.sql("billing.fixtures.create_test_emails");
		await db.sql("billing.fixtures.create_test_invites");

		const recipientEmails = [
			"test+already_invited@permanent.org",
			"test+not_a_user_yet@permanent.org",
			"test+1@permanent.org",
		];

		const results = await agent
			.post("/api/v2/billing/gift")
			.send({
				storageAmount: 1,
				recipientEmails,
			})
			.expect(200);

		expect(results.body).toEqual({
			giftDelivered: ["test+1@permanent.org"],
			invitationSent: ["test+not_a_user_yet@permanent.org"],
			alreadyInvited: ["test+already_invited@permanent.org"],
			storageGifted: 2,
		});
	});

	test("should log error and return 500 if check for existing emails fails", async () => {
		const testError = new Error("test error");
		jest.spyOn(db, "sql").mockImplementationOnce(async () => {
			throw testError;
		});

		await agent
			.post("/api/v2/billing/gift")
			.send({ storageAmount: 1, recipientEmails: ["test+1@permanent.org"] })
			.expect(500);

		expect(logger.error).toHaveBeenCalledWith(testError);
	});

	test("should log error and return 500 if check for invited emails fails", async () => {
		const testError = new Error("test error");
		const spy = jest.spyOn(db, "sql");
		when(spy)
			.calledWith("billing.queries.get_invited_emails", {
				emails: ["test+1@permanent.org"],
			})
			.mockRejectedValueOnce(testError);

		await agent
			.post("/api/v2/billing/gift")
			.send({ storageAmount: 1, recipientEmails: ["test+1@permanent.org"] })
			.expect(500);

		expect(logger.error).toHaveBeenCalledWith(testError);
	});

	test("should log error and return 500 if check for available space fails", async () => {
		const testError = new Error("test error");
		const spy = jest.spyOn(db, "sql");
		when(spy)
			.calledWith("billing.queries.get_account_space_for_update", {
				email: "test@permanent.org",
			})
			.mockRejectedValueOnce(testError);

		await agent
			.post("/api/v2/billing/gift")
			.send({ storageAmount: 1, recipientEmails: ["test+1@permanent.org"] })
			.expect(500);

		expect(logger.error).toHaveBeenCalledWith(testError);
	});

	test("should log error and return 500 if check for available space finds nothing", async () => {
		const spy = jest.spyOn(db, "sql");
		when(spy)
			.calledWith("billing.queries.get_account_space_for_update", {
				email: "test@permanent.org",
			})
			.mockImplementationOnce(jest.fn().mockResolvedValueOnce({ rows: [] }));

		await agent
			.post("/api/v2/billing/gift")
			.send({ storageAmount: 1, recipientEmails: ["test+1@permanent.org"] })
			.expect(500);

		expect(logger.error).toHaveBeenCalledWith(
			"Empty response from account_space query",
		);
	});

	test("should log error and return 500 if recording gifts for existing accounts fails", async () => {
		const testError = new Error("test error");
		const spy = jest.spyOn(db, "sql");
		when(spy)
			.calledWith("billing.queries.get_existing_account_emails", {
				emails: ["test+1@permanent.org"],
			})
			.mockImplementationOnce(
				jest
					.fn()
					.mockResolvedValueOnce({ rows: [{ email: "test+1@permanent.org" }] }),
			);
		when(spy)
			.calledWith("billing.queries.get_account_space_for_update", {
				email: "test@permanent.org",
			})
			.mockImplementationOnce(
				jest.fn().mockResolvedValueOnce({ rows: [{ spaceLeft: 2 * GB }] }),
			);
		when(spy)
			.calledWith("billing.queries.record_gift", {
				fromEmail: "test@permanent.org",
				toEmails: ["test+1@permanent.org"],
				storageAmountInBytes: 1 * GB,
				recipientCount: 1,
			})
			.mockRejectedValueOnce(testError);

		await agent
			.post("/api/v2/billing/gift")
			.send({ storageAmount: 1, recipientEmails: ["test+1@permanent.org"] })
			.expect(500);

		expect(logger.error).toHaveBeenCalledWith(testError);
	});

	test("should log error and return 500 if creating invites fails", async () => {
		const testError = new Error("test error");
		const spy = jest.spyOn(db, "sql");
		when(spy)
			.calledWith("billing.queries.get_account_space_for_update", {
				email: "test@permanent.org",
			})
			.mockImplementationOnce(
				jest.fn().mockResolvedValueOnce({ rows: [{ spaceLeft: 2 * GB }] }),
			);
		when(spy)
			.calledWith("billing.queries.create_invites", {
				emails: ["test+1@permanent.org"],
				storageAmountInBytes: 1 * GB,
				tokens: [expect.any(String)],
				byAccountEmail: "test@permanent.org",
				recipientCount: 1,
			})
			.mockRejectedValueOnce(testError);

		await agent
			.post("/api/v2/billing/gift")
			.send({ storageAmount: 1, recipientEmails: ["test+1@permanent.org"] })
			.expect(500);

		expect(logger.error).toHaveBeenCalledWith(testError);
	});
});
