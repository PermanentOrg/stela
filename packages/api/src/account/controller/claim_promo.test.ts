import request from "supertest";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { NextFunction } from "express";
import createError from "http-errors";
import type { TinyPg, TinyPgParams } from "tinypg";
import { logger } from "@stela/logger";
import { app } from "../../app.js";
import { db } from "../../database.js";
import { GB } from "../../constants.js";
import { verifyUserAuthentication } from "../../middleware/index.js";
import { mockVerifyUserAuthentication } from "../../../test/middleware_mocks.js";

vi.mock("../../database");
vi.mock("../../middleware");
vi.mock("@stela/logger");

const testEmail = "test@permanent.org";
const testAccountId = "2";

const getAccountSpace = async (
	accountId: string,
): Promise<{ spaceLeft: string; spaceTotal: string } | undefined> => {
	const {
		rows: [row],
	} = await db.query<{ spaceLeft: string; spaceTotal: string }>(
		'SELECT spaceleft "spaceLeft", spacetotal "spaceTotal" FROM account_space WHERE accountid = :accountId',
		{ accountId },
	);
	return row;
};

const getPromoRemainingUses = async (
	code: string,
): Promise<number | undefined> => {
	const {
		rows: [row],
	} = await db.query<{ remainingUses: string }>(
		'SELECT remaininguses "remainingUses" FROM promo WHERE code = :code',
		{ code },
	);
	return row === undefined ? undefined : +row.remainingUses;
};

const getAccountPromo = async (
	accountId: string,
	promoCode: string,
): Promise<{ id: string } | undefined> => {
	const {
		rows: [row],
	} = await db.query<{ id: string }>(
		`SELECT account_promo.account_promoid AS id
     FROM account_promo
     INNER JOIN promo ON promo.promoid = account_promo.promoid
     WHERE account_promo.accountid = :accountId AND promo.code = :promoCode`,
		{ accountId, promoCode },
	);
	return row;
};

describe("POST /accounts/me/promo-claim", () => {
	const agent = request(app);

	const setupDatabase = async (): Promise<void> => {
		await db.sql("account.fixtures.create_test_accounts");
		await db.sql("account.fixtures.create_test_account_space");
		await db.sql("account.fixtures.create_test_promos_for_claim");
	};

	const clearDatabase = async (): Promise<void> => {
		await db.query(
			"TRUNCATE account, account_space, ledger_financial, promo, account_promo CASCADE",
		);
	};

	const isTinyPg = (value: unknown): value is TinyPg =>
		value !== null && typeof value === "object" && "sql" in value;

	const mockQueryFailure = (queryNameToFail: string, error: Error): void => {
		vi.spyOn(db, "sql").mockImplementation(async function (
			this: TinyPg,
			name: string,
			params?: TinyPgParams,
		) {
			if (name === queryNameToFail) throw error;
			const proto: unknown = Object.getPrototypeOf(db);
			if (!isTinyPg(proto))
				throw new TypeError("Unexpected db prototype shape");
			return await proto.sql.call(this, name, params);
		});
	};

	beforeEach(async () => {
		mockVerifyUserAuthentication(
			testEmail,
			"6b640c73-4963-47de-a096-4a05ff8dc5f5",
		);
		await clearDatabase();
		await setupDatabase();
	});

	afterEach(async () => {
		await clearDatabase();
		vi.restoreAllMocks();
	});

	test("should return 200 with the storage grant in GB", async () => {
		const response = await agent
			.post("/api/v2/accounts/me/promo-claim")
			.send({ promoCode: "VALID_PROMO" })
			.expect(200);

		expect(response.body).toEqual({ data: { storageGrantInGb: 1 } });
	});

	test("should add storage to the account", async () => {
		const initialSpace = await getAccountSpace(testAccountId);

		await agent
			.post("/api/v2/accounts/me/promo-claim")
			.send({ promoCode: "VALID_PROMO" })
			.expect(200);

		const updatedSpace = await getAccountSpace(testAccountId);
		expect(+(updatedSpace?.spaceTotal ?? 0)).toBe(
			+(initialSpace?.spaceTotal ?? 0) + GB,
		);
	});

	test("should create an account_promo record", async () => {
		await agent
			.post("/api/v2/accounts/me/promo-claim")
			.send({ promoCode: "VALID_PROMO" })
			.expect(200);

		const claim = await getAccountPromo(testAccountId, "VALID_PROMO");
		expect(claim).toBeDefined();
	});

	test("should decrement the promo remainingUses", async () => {
		const initialUses = await getPromoRemainingUses("VALID_PROMO");

		await agent
			.post("/api/v2/accounts/me/promo-claim")
			.send({ promoCode: "VALID_PROMO" })
			.expect(200);

		const updatedUses = await getPromoRemainingUses("VALID_PROMO");
		expect(updatedUses).toBe((initialUses ?? 0) - 1);
	});

	test("should create a ledger entry with promo type", async () => {
		const initialSpace = await getAccountSpace(testAccountId);
		const initialTotal = parseInt(initialSpace?.spaceTotal ?? "0", 10);

		await agent
			.post("/api/v2/accounts/me/promo-claim")
			.send({ promoCode: "VALID_PROMO" })
			.expect(200);

		const {
			rows: [ledgerRow],
		} = await db.query<{
			spaceDelta: string;
			toSpaceBefore: string;
			toSpaceLeft: string;
			toSpaceTotal: string;
		}>(
			`SELECT spacedelta "spaceDelta", tospacebefore "toSpaceBefore", tospaceleft "toSpaceLeft", tospacetotal "toSpaceTotal" FROM ledger_financial
       WHERE toaccountid = :accountId AND type = 'type.billing.transfer.promo'`,
			{ accountId: testAccountId },
		);
		expect(ledgerRow).toBeDefined();
		if (ledgerRow === undefined) return;
		expect(ledgerRow.spaceDelta).toBe(GB.toString());
		expect(ledgerRow.toSpaceBefore).toBe(initialSpace?.spaceTotal);
		expect(parseInt(ledgerRow.toSpaceLeft, 10)).toBe(initialTotal + GB);
		expect(parseInt(ledgerRow.toSpaceTotal, 10)).toBe(initialTotal + GB);
	});

	test("should return 401 if not authenticated", async () => {
		vi.mocked(verifyUserAuthentication).mockImplementation(
			async (_req, _res, next: NextFunction) => {
				next(new createError.Unauthorized("You aren't logged in"));
			},
		);
		await agent
			.post("/api/v2/accounts/me/promo-claim")
			.send({ promoCode: "VALID_PROMO" })
			.expect(401);
	});

	test("should return 400 if promoCode is missing", async () => {
		await agent.post("/api/v2/accounts/me/promo-claim").send({}).expect(400);
	});

	test("should return 400 if emailFromAuthToken is missing", async () => {
		mockVerifyUserAuthentication(
			undefined,
			"6b640c73-4963-47de-a096-4a05ff8dc5f5",
		);
		await agent
			.post("/api/v2/accounts/me/promo-claim")
			.send({ promoCode: "VALID_PROMO" })
			.expect(400);
	});

	test("should return 400 if userSubjectFromAuthToken is missing", async () => {
		mockVerifyUserAuthentication(testEmail, undefined);
		await agent
			.post("/api/v2/accounts/me/promo-claim")
			.send({ promoCode: "VALID_PROMO" })
			.expect(400);
	});

	test("should return 404 if the caller account can't be found", async () => {
		mockVerifyUserAuthentication(
			"test+nonexistent@permanent.org",
			"6b640c73-4963-47de-a096-4a05ff8dc5f5",
		);
		await agent
			.post("/api/v2/accounts/me/promo-claim")
			.send({ promoCode: "VALID_PROMO" })
			.expect(404);
	});

	test("should return 400 for a nonexistent promo code", async () => {
		await agent
			.post("/api/v2/accounts/me/promo-claim")
			.send({ promoCode: "DOES_NOT_EXIST" })
			.expect(400);
	});

	test("should return 400 for an invalid promo code", async () => {
		await agent
			.post("/api/v2/accounts/me/promo-claim")
			.send({ promoCode: "INVALID_PROMO" })
			.expect(400);
	});

	test("should return 400 for an expired promo code", async () => {
		await agent
			.post("/api/v2/accounts/me/promo-claim")
			.send({ promoCode: "EXPIRED_PROMO" })
			.expect(400);
	});

	test("should return 400 for a promo code with no remaining uses", async () => {
		await agent
			.post("/api/v2/accounts/me/promo-claim")
			.send({ promoCode: "NO_USES_PROMO" })
			.expect(400);
	});

	test("should return 400 if the promo code has already been claimed", async () => {
		await agent
			.post("/api/v2/accounts/me/promo-claim")
			.send({ promoCode: "VALID_PROMO" })
			.expect(200);

		await agent
			.post("/api/v2/accounts/me/promo-claim")
			.send({ promoCode: "VALID_PROMO" })
			.expect(400);
	});

	test("should return 500 if the transaction fails", async () => {
		vi.spyOn(db, "transaction").mockRejectedValueOnce(new Error("SQL error"));

		await agent
			.post("/api/v2/accounts/me/promo-claim")
			.send({ promoCode: "VALID_PROMO" })
			.expect(500);
	});

	describe("individual query failures with transaction rollback", () => {
		test("should return 500 and log error if get_promo_by_code fails", async () => {
			const testError = new Error("DB error");
			mockQueryFailure("promo.queries.get_promo_by_code", testError);

			await agent
				.post("/api/v2/accounts/me/promo-claim")
				.send({ promoCode: "VALID_PROMO" })
				.expect(500);

			expect(logger.error).toHaveBeenCalledWith(testError);
		});

		test("should return 500 and log error if check_account_promo fails", async () => {
			const testError = new Error("DB error");
			mockQueryFailure("promo.queries.check_account_promo", testError);

			await agent
				.post("/api/v2/accounts/me/promo-claim")
				.send({ promoCode: "VALID_PROMO" })
				.expect(500);

			expect(logger.error).toHaveBeenCalledWith(testError);
		});

		test("should return 500 and log error if decrement_promo_remaining_uses fails", async () => {
			const testError = new Error("DB error");
			mockQueryFailure(
				"promo.queries.decrement_promo_remaining_uses",
				testError,
			);

			await agent
				.post("/api/v2/accounts/me/promo-claim")
				.send({ promoCode: "VALID_PROMO" })
				.expect(500);

			expect(logger.error).toHaveBeenCalledWith(testError);
		});

		test("should return 400 if decrement_promo_remaining_uses returns 0 rows", async () => {
			vi.spyOn(db, "sql").mockImplementation(async function (
				this: TinyPg,
				name: string,
				params?: TinyPgParams,
			) {
				if (name === "promo.queries.decrement_promo_remaining_uses")
					return { command: "", row_count: 0, rows: [] };
				const proto: unknown = Object.getPrototypeOf(db);
				if (!isTinyPg(proto))
					throw new TypeError("Unexpected db prototype shape");
				return await proto.sql.call(this, name, params);
			});

			await agent
				.post("/api/v2/accounts/me/promo-claim")
				.send({ promoCode: "VALID_PROMO" })
				.expect(400);
		});

		test("should return 500 and roll back decrement if create_account_promo fails", async () => {
			const initialUses = await getPromoRemainingUses("VALID_PROMO");
			const testError = new Error("DB error");
			mockQueryFailure("promo.queries.create_account_promo", testError);

			await agent
				.post("/api/v2/accounts/me/promo-claim")
				.send({ promoCode: "VALID_PROMO" })
				.expect(500);

			expect(logger.error).toHaveBeenCalledWith(testError);
			const remainingUses = await getPromoRemainingUses("VALID_PROMO");
			expect(remainingUses).toBe(initialUses);
			const claim = await getAccountPromo(testAccountId, "VALID_PROMO");
			expect(claim).toBeUndefined();
		});

		test("should return 500 and roll back all writes if adjust_account_storage fails", async () => {
			const initialUses = await getPromoRemainingUses("VALID_PROMO");
			const initialSpace = await getAccountSpace(testAccountId);
			const testError = new Error("DB error");
			mockQueryFailure("storage.queries.adjust_account_storage", testError);

			await agent
				.post("/api/v2/accounts/me/promo-claim")
				.send({ promoCode: "VALID_PROMO" })
				.expect(500);

			expect(logger.error).toHaveBeenCalledWith(testError);
			const remainingUses = await getPromoRemainingUses("VALID_PROMO");
			expect(remainingUses).toBe(initialUses);
			const claim = await getAccountPromo(testAccountId, "VALID_PROMO");
			expect(claim).toBeUndefined();
			const space = await getAccountSpace(testAccountId);
			expect(space?.spaceTotal).toBe(initialSpace?.spaceTotal);
		});

		test("should return 500 and roll back all writes if adjust_account_storage returns 0 rows", async () => {
			mockVerifyUserAuthentication(
				"test+4@permanent.org", // this account has no account_space row, so the adjust storage query will update 0 rows
				"ea61ff40-f4a2-4f02-848b-a19c2b60728a",
			);
			const initialUses = await getPromoRemainingUses("VALID_PROMO");
			const initialSpace = await getAccountSpace(testAccountId);

			await agent
				.post("/api/v2/accounts/me/promo-claim")
				.send({ promoCode: "VALID_PROMO" })
				.expect(500);

			const remainingUses = await getPromoRemainingUses("VALID_PROMO");
			expect(remainingUses).toBe(initialUses);
			const claim = await getAccountPromo(testAccountId, "VALID_PROMO");
			expect(claim).toBeUndefined();
			const space = await getAccountSpace(testAccountId);
			expect(space?.spaceTotal).toBe(initialSpace?.spaceTotal);
		});
	});
});
