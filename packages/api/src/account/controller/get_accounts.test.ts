import request from "supertest";
import { vi } from "vitest";
import { logger } from "@stela/logger";
import { app } from "../../app";
import { db } from "../../database";
import { verifyAdminAuthentication } from "../../middleware";
import { mockVerifyAdminAuthentication } from "../../../test/middleware_mocks";
import type { Account } from "../models";

vi.mock("../../database");
vi.mock("../../middleware");
vi.mock("@stela/logger");

const setupDatabase = async (): Promise<void> => {
	await db.sql("account.fixtures.create_test_accounts");
};

const clearDatabase = async (): Promise<void> => {
	await db.query("TRUNCATE account CASCADE");
};

describe("GET /account", () => {
	const agent = request(app);

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
		vi.clearAllMocks();
	});

	test("should call verifyAdminAuthentication", async () => {
		await agent.get("/api/v2/account?accountIds[]=2&pageSize=10");
		expect(verifyAdminAuthentication).toHaveBeenCalled();
	});

	test("should return 400 if email from auth token is missing", async () => {
		mockVerifyAdminAuthentication(
			undefined,
			"13bb917e-7c75-4971-a8ee-b22e82432888",
		);
		await agent.get("/api/v2/account?accountIds[]=2&pageSize=10").expect(400);
	});

	test("should return 400 if admin subject from auth token is missing", async () => {
		mockVerifyAdminAuthentication("admin@permanent.org");
		await agent.get("/api/v2/account?accountIds[]=2&pageSize=10").expect(400);
	});

	test("should return 400 if neither accountIds nor accountEmails is provided", async () => {
		await agent.get("/api/v2/account?pageSize=10").expect(400);
	});

	test("should return 400 if pageSize is not provided", async () => {
		await agent.get("/api/v2/account?accountIds[]=2").expect(400);
	});

	test("should return 400 if both accountIds and accountEmails are provided", async () => {
		await agent
			.get(
				"/api/v2/account?accountIds[]=2&accountEmails[]=test@permanent.org&pageSize=10",
			)
			.expect(400);
	});

	test("should return 400 if accountEmails contains an invalid email", async () => {
		await agent
			.get("/api/v2/account?accountEmails[]=not-an-email&pageSize=10")
			.expect(400);
	});

	test("should return accounts matching the given accountIds", async () => {
		const response = await agent
			.get("/api/v2/account?accountIds[]=2&accountIds[]=3&pageSize=10")
			.expect(200);

		const {
			body: { items },
		} = response as { body: { items: Account[] } };
		expect(items).toHaveLength(2);
		const ids = items.map((a: { id: string }) => a.id);
		expect(ids).toContain("2");
		expect(ids).toContain("3");
	});

	test("should return the correct account shape when filtering by accountIds", async () => {
		const response = await agent
			.get("/api/v2/account?accountIds[]=2&pageSize=10")
			.expect(200);

		const {
			body: {
				items: [account],
			},
		} = response as { body: { items: Account[] } };
		if (account === undefined) {
			expect(account).toBeDefined();
		} else {
			expect(account.id).toBe("2");
			expect(account.primaryEmail.address).toBe("test@permanent.org");
			expect(account.primaryEmail.verified).toBe(false);
			expect(account.fullName).toBe("Jack Rando");
			expect(account.address).toEqual({
				lineOne: null,
				lineTwo: null,
				city: null,
				state: null,
				zip: null,
				country: null,
			});
			expect(account.settings.hideChecklist).toBe(false);
			expect(account.settings.allowSftpDeletion).toBe(false);
			expect(account.settings.notificationsEnabled).toEqual({});
			expect(account.type).toEqual("standard");
			expect(account.status).toEqual("ok");
		}
	});

	test("should not return a deleted account", async () => {
		const response = await agent
			.get("/api/v2/account?accountIds[]=34&pageSize=10")
			.expect(200);

		const {
			body: { items },
		} = response as { body: { items: Account[] } };
		expect(items.length).toEqual(0);
	});

	test("should return accounts matching the given accountEmails", async () => {
		const response = await agent
			.get("/api/v2/account?accountEmails[]=test@permanent.org&pageSize=10")
			.expect(200);

		const {
			body: { items },
		} = response as { body: { items: Account[] } };
		expect(items).toHaveLength(1);
		expect(items[0]?.id).toBe("2");
	});

	test("should lookup accounts by email case-insensitively", async () => {
		const response = await agent
			.get("/api/v2/account?accountEmails[]=TEST@permanent.org&pageSize=10")
			.expect(200);

		const {
			body: { items },
		} = response as { body: { items: Account[] } };
		expect(items).toHaveLength(1);
		expect(items[0]?.id).toBe("2");
	});

	test("should return accounts matching multiple given accountEmails", async () => {
		const response = await agent
			.get(
				"/api/v2/account?accountEmails[]=test@permanent.org&accountEmails[]=test%2B1@permanent.org&pageSize=10",
			)
			.expect(200);

		const {
			body: { items },
		} = response as { body: { items: Account[] } };
		expect(items).toHaveLength(2);
		const ids = items.map((a: { id: string }) => a.id);
		expect(ids).toContain("2");
		expect(ids).toContain("3");
	});

	test("should match accountEmails case-insensitively", async () => {
		const response = await agent
			.get("/api/v2/account?accountEmails[]=TEST@PERMANENT.ORG&pageSize=10")
			.expect(200);

		const {
			body: { items },
		} = response as { body: { items: Account[] } };
		expect(items).toHaveLength(1);
		expect(items[0]?.id).toBe("2");
	});

	test("should return empty items array when no accounts match", async () => {
		const response = await agent
			.get("/api/v2/account?accountIds[]=99999&pageSize=10")
			.expect(200);

		const {
			body: { items, pagination },
		} = response as {
			body: {
				items: Account[];
				pagination: {
					nextCursor: string;
					nextPage: string;
					totalPages: number;
				};
			};
		};
		expect(items).toHaveLength(0);
		expect(pagination.totalPages).toBe(0);
	});

	test("should return a pagination object", async () => {
		const response = await agent
			.get("/api/v2/account?accountIds[]=2&accountIds[]=3&pageSize=1")
			.expect(200);

		const {
			body: { pagination },
		} = response as {
			body: {
				items: Account[];
				pagination: {
					nextCursor: string;
					nextPage: string;
					totalPages: number;
				};
			};
		};
		expect(pagination).toBeDefined();
		expect(pagination.totalPages).toBe(2);
		expect(pagination.nextCursor).toBe("2");
		expect(pagination.nextPage).toBe(
			"https:///api/v2/accounts?pageSize=1&cursor=2",
		);
	});

	test("should access a later page when given a cursor", async () => {
		const response = await agent
			.get("/api/v2/account?accountIds[]=2&accountIds[]=3&pageSize=1&cursor=2")
			.expect(200);

		const {
			body: { items },
		} = response as { body: { items: Account[] } };
		expect(items).toHaveLength(1);
		expect(items[0]?.id).toBe("3");
	});

	test("should log error and return 500 if database query fails", async () => {
		const testError = new Error("test error");
		vi.spyOn(db, "sql").mockRejectedValueOnce(testError);

		await agent.get("/api/v2/account?accountIds[]=2&pageSize=10").expect(500);

		expect(logger.error).toHaveBeenCalledWith(testError);
	});

	test("should accept a single accountId string (not array)", async () => {
		const response = await agent
			.get("/api/v2/account?accountIds=2&pageSize=10")
			.expect(200);

		const {
			body: { items },
		} = response as { body: { items: Account[] } };
		expect(items).toHaveLength(1);
		expect(items[0]?.id).toBe("2");
	});
});
