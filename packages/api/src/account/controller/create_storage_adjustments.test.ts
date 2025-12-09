import request from "supertest";
import { when } from "jest-when";
import { logger } from "@stela/logger";
import { app } from "../../app";
import { db } from "../../database";
import { GB } from "../../constants";
import { verifyAdminAuthentication } from "../../middleware";
import type { StorageAdjustment } from "../models";
import { mockVerifyAdminAuthentication } from "../../../test/middleware_mocks";

jest.mock("../../database");
jest.mock("../../middleware");
jest.mock("@stela/logger");

interface AccountSpace {
	spaceLeft: string;
	spaceTotal: string;
}

const testAccountId = "3";

const getAccountSpace = async (
	accountId: string,
): Promise<AccountSpace | undefined> => {
	const result = await db.query<AccountSpace>(
		'SELECT spaceLeft "spaceLeft", spaceTotal "spaceTotal" FROM account_space WHERE accountId = :accountId',
		{ accountId },
	);
	return result.rows[0];
};

describe("/account/storage-adjustments", () => {
	const agent = request(app);

	const setupDatabase = async (): Promise<void> => {
		await db.sql("storage.fixtures.create_test_accounts");
		await db.sql("storage.fixtures.create_test_account_space");
		await db.sql("storage.fixtures.create_test_emails");
	};

	const clearDatabase = async (): Promise<void> => {
		await db.query(
			"TRUNCATE account, account_space, ledger_financial, email, invite CASCADE",
		);
	};

	beforeEach(async () => {
		mockVerifyAdminAuthentication(
			"admin@permanent.org",
			"13bb917e-7c75-4971-a8ee-b22e82432888",
		);
		await clearDatabase();
		await setupDatabase();
	});

	afterEach(async () => {
		await clearDatabase();
		jest.clearAllMocks();
	});

	test("should call verifyAdminAuthentication", async () => {
		await agent.post(`/api/v2/account/${testAccountId}/storage-adjustments`);
		expect(verifyAdminAuthentication).toHaveBeenCalled();
	});

	test("should return invalid request status if email from auth token is missing", async () => {
		mockVerifyAdminAuthentication(
			undefined,
			"13bb917e-7c75-4971-a8ee-b22e82432888",
		);
		await agent
			.post(`/api/v2/account/${testAccountId}/storage-adjustments`)
			.expect(400);
	});

	test("should return invalid request status if email from auth token is not an email", async () => {
		mockVerifyAdminAuthentication(
			"not_an_email",
			"13bb917e-7c75-4971-a8ee-b22e82432888",
		);
		await agent
			.post(`/api/v2/account/${testAccountId}/storage-adjustments`)
			.expect(400);
	});

	test("should return invalid request status if subject from auth token is missing", async () => {
		mockVerifyAdminAuthentication("admin@permanent.org");
		await agent
			.post(`/api/v2/account/${testAccountId}/storage-adjustments`)
			.expect(400);
	});

	test("should return invalid request status if subject from auth token is not a uuid", async () => {
		mockVerifyAdminAuthentication("admin@permanent.org", "not_a_uuid");
		await agent
			.post(`/api/v2/account/${testAccountId}/storage-adjustments`)
			.expect(400);
	});

	test("should return invalid request status if storageAmount is missing", async () => {
		await agent
			.post(`/api/v2/account/${testAccountId}/storage-adjustments`)
			.send({})
			.expect(400);
	});

	test("should return invalid request status if storageAmount is not a number", async () => {
		await agent
			.post(`/api/v2/account/${testAccountId}/storage-adjustments`)
			.send({
				storageAmount: "not_a_number",
			})
			.expect(400);
	});

	test("should return invalid request status if storageAmount is not an integer", async () => {
		await agent
			.post(`/api/v2/account/${testAccountId}/storage-adjustments`)
			.send({ storageAmount: 5.5 })
			.expect(400);
	});

	test("should return 404 if account does not exist", async () => {
		await agent
			.post(`/api/v2/account/10000000/storage-adjustments`)
			.send({ storageAmount: 5 })
			.expect(404);
	});

	test("should successfully adjust storage with positive amount", async () => {
		const initialAccountSpace = await getAccountSpace(testAccountId);

		const response = await agent
			.post(`/api/v2/account/${testAccountId}/storage-adjustments`)
			.send({ storageAmount: 5 })
			.expect(200);

		expect(response.body).toHaveProperty("newStorageTotal");
		expect(response.body).toHaveProperty("adjustmentAmount");
		expect(response.body).toHaveProperty("createdAt");

		const updatedAccountSpace = await getAccountSpace(testAccountId);
		if (
			initialAccountSpace?.spaceTotal === undefined ||
			updatedAccountSpace?.spaceTotal === undefined
		) {
			expect(false).toBe(true);
		} else {
			expect(+updatedAccountSpace.spaceTotal).toBe(
				+initialAccountSpace.spaceTotal + 5 * GB,
			);
		}
	});

	test("should successfully adjust storage with negative amount", async () => {
		const initialAccountSpace = await getAccountSpace(testAccountId);

		const response = await agent
			.post(`/api/v2/account/${testAccountId}/storage-adjustments`)
			.send({ storageAmount: -1 })
			.expect(200);

		expect(response.body).toHaveProperty("newStorageTotal");
		expect(response.body).toHaveProperty("adjustmentAmount");
		expect(response.body).toHaveProperty("createdAt");

		const updatedAccountSpace = await getAccountSpace(testAccountId);
		if (
			initialAccountSpace?.spaceTotal === undefined ||
			updatedAccountSpace?.spaceTotal === undefined
		) {
			expect(false).toBe(true);
		} else {
			expect(+updatedAccountSpace.spaceTotal).toBe(
				+initialAccountSpace.spaceTotal - 1 * GB,
			);
		}
	});

	test("should return correct storageTotal and storageUsed in GB", async () => {
		const initialAccountSpace = await getAccountSpace(testAccountId);

		const response = await agent
			.post(`/api/v2/account/${testAccountId}/storage-adjustments`)
			.send({ storageAmount: 3 })
			.expect(200);

		if (initialAccountSpace?.spaceTotal === undefined) {
			expect(false).toBe(true);
		} else {
			const {
				body: { newStorageTotal, adjustmentAmount, createdAt },
			} = response as { body: StorageAdjustment };
			expect(newStorageTotal).toBe(
				(+initialAccountSpace.spaceTotal + 3 * GB) / GB,
			);
			expect(adjustmentAmount).toBe(3);
			expect(createdAt).toBeDefined();
		}
	});

	test("should create ledger entry with correct type", async () => {
		const initialAccountSpace = await getAccountSpace(testAccountId);

		await agent
			.post(`/api/v2/account/${testAccountId}/storage-adjustments`)
			.send({ storageAmount: 5 })
			.expect(200);

		const ledgerEntryResponse = await db.query<{
			type: string;
			spaceDelta: string;
			toAccountId: string;
			fileDelta: string;
			fromAccountId: string;
			fromSpaceBefore: string;
			fromSpaceLeft: string;
			fromSpaceTotal: string;
			fromFileBefore: string;
			fromFileLeft: string;
			fromFileTotal: string;
			toSpaceBefore: string;
			toSpaceLeft: string;
			toSpaceTotal: string;
			toFileBefore: string;
			toFileLeft: string;
			toFileTotal: string;
		}>(
			`SELECT
        type,
        spacedelta "spaceDelta",
        toaccountid "toAccountId",
        filedelta "fileDelta",
        fromaccountid "fromAccountId",
        fromspacebefore "fromSpaceBefore",
        fromspaceleft "fromSpaceLeft",
        fromspacetotal "fromSpaceTotal",
        toaccountid "toAccountId",
        tospacebefore "toSpaceBefore",
        tospaceleft "toSpaceLeft",
        tospacetotal "toSpaceTotal",
        status
      FROM
        ledger_financial
      WHERE
        type = 'type.billing.transfer.admin_adjustment'
        AND toAccountId = :accountId`,
			{ accountId: testAccountId },
		);

		if (ledgerEntryResponse.rows[0] === undefined) {
			expect(true).toBe(false);
		} else {
			expect(ledgerEntryResponse.rows[0].type).toBe(
				"type.billing.transfer.admin_adjustment",
			);
			expect(ledgerEntryResponse.rows[0].spaceDelta).toBe((5 * GB).toString());
			expect(ledgerEntryResponse.rows[0].fileDelta).toBe("0");
			expect(ledgerEntryResponse.rows[0].fromAccountId).toBe("0");
			expect(ledgerEntryResponse.rows[0].fromSpaceBefore).toBe("0");
			expect(ledgerEntryResponse.rows[0].fromSpaceLeft).toBe("0");
			expect(ledgerEntryResponse.rows[0].fromSpaceTotal).toBe("0");
			expect(ledgerEntryResponse.rows[0].toAccountId).toBe("3");
			expect(ledgerEntryResponse.rows[0].toSpaceBefore).toBe(
				initialAccountSpace?.spaceTotal,
			);
			expect(parseInt(ledgerEntryResponse.rows[0].toSpaceLeft, 10)).toBe(
				parseInt(initialAccountSpace?.spaceTotal ?? "0", 10) + 5 * GB,
			);
			expect(parseInt(ledgerEntryResponse.rows[0].toSpaceTotal, 10)).toBe(
				parseInt(initialAccountSpace?.spaceTotal ?? "0", 10) + 5 * GB,
			);
		}
	});

	test("should log error and return 500 if storage adjustment fails", async () => {
		const testError = new Error("test error");
		const spy = jest.spyOn(db, "sql");
		when(spy)
			.calledWith("account.queries.adjust_account_storage", {
				accountId: testAccountId,
				storageAmountInBytes: 5 * GB,
			})
			.mockRejectedValueOnce(testError);

		await agent
			.post(`/api/v2/account/${testAccountId}/storage-adjustments`)
			.send({ storageAmount: 5 })
			.expect(500);

		expect(logger.error).toHaveBeenCalledWith(testError);
	});

	test("should handle zero storage adjustment", async () => {
		await agent
			.post(`/api/v2/account/${testAccountId}/storage-adjustments`)
			.send({ storageAmount: 0 })
			.expect(400);
	});
});
