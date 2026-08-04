import request from "supertest";
import {
	afterAll,
	afterEach,
	beforeEach,
	describe,
	expect,
	test,
	vi,
} from "vitest";
import { logger } from "@stela/logger";
import { app } from "../../app.js";
import { db } from "../../database.js";
import { verifyUserAuthentication } from "../../middleware/index.js";
import { mockVerifyUserAuthentication } from "../../../test/middleware_mocks.js";
import type { Account } from "../models.js";
import { runFixtures } from "../../../test/run_fixtures.js";

vi.mock("../../database");
vi.mock("../../middleware");
vi.mock("@stela/logger");

const setupDatabase = async (): Promise<void> => {
	await runFixtures(db, [
		"account.fixtures.create_test_accounts",
		"account.fixtures.create_test_archives",
		"account.fixtures.create_test_account_archives",
		"account.fixtures.create_test_profile_items",
	]);
};

const clearDatabase = async (): Promise<void> => {
	await db.query(
		"TRUNCATE profile_item, account_archive, archive, account CASCADE",
	);
};

describe("GET /accounts/me", () => {
	const agent = request(app);

	beforeEach(async () => {
		mockVerifyUserAuthentication(
			"test@permanent.org",
			"13bb917e-7c75-4971-a8ee-b22e82432888",
		);
		await clearDatabase();
		await setupDatabase();
	});

	afterEach(async () => {
		vi.clearAllMocks();
	});

	afterAll(async () => {
		await clearDatabase();
	});

	test("should call verifyUserAuthentication", async () => {
		await agent.get("/api/v2/accounts/me");
		expect(verifyUserAuthentication).toHaveBeenCalled();
	});

	test("should return 400 if email from auth token is missing", async () => {
		mockVerifyUserAuthentication(
			undefined,
			"13bb917e-7c75-4971-a8ee-b22e82432888",
		);
		await agent.get("/api/v2/accounts/me").expect(400);
	});

	test("should return 400 if user subject from auth token is missing", async () => {
		mockVerifyUserAuthentication("test@permanent.org");
		await agent.get("/api/v2/accounts/me").expect(400);
	});

	test("should return 200 with the authenticated account", async () => {
		const response = await agent.get("/api/v2/accounts/me").expect(200);

		const {
			body: { data: account },
		} = response as { body: { data: Account } };
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
		expect(account.createdAt).toEqual("2026-06-01T00:00:00.000Z");
		expect(account.updatedAt).toEqual("2026-07-01T00:00:00.000Z");
	});

	test("should return archiveMemberships for the authenticated account", async () => {
		const response = await agent.get("/api/v2/accounts/me").expect(200);

		const {
			body: { data: account },
		} = response as { body: { data: Account } };
		expect(account.archiveMemberships).toBeDefined();
		expect(account.archiveMemberships).toHaveLength(1);
		if (account.archiveMemberships[0] !== undefined) {
			const {
				archiveMemberships: [membership],
			} = account;
			expect(membership.id).toBe("3");
			expect(membership.accountId).toBe("2");
			expect(membership.accessRole).toBe("owner");
			expect(membership.status).toBe("ok");
			expect(membership.archive.id).toBe("1");
			expect(membership.archive.name).toBe("Test Archive 1");
			expect(membership.archive.thumbnailUrls).toEqual({
				width200: null,
				width500: null,
				width1000: null,
				width2000: null,
			});
		}
	});

	test("should return 404 if the authenticated account does not exist", async () => {
		mockVerifyUserAuthentication(
			"nonexistent@permanent.org",
			"13bb917e-7c75-4971-a8ee-b22e82432888",
		);
		await agent.get("/api/v2/accounts/me").expect(404);
	});

	test("should return 404 for a deleted account", async () => {
		await db.query(`
			INSERT INTO account (accountid, primaryemail, status, notificationpreferences, type)
			VALUES (99, 'deleted@permanent.org', 'status.generic.deleted', '{}', 'type.account.standard')
		`);
		mockVerifyUserAuthentication(
			"deleted@permanent.org",
			"13bb917e-7c75-4971-a8ee-b22e82432888",
		);
		await agent.get("/api/v2/accounts/me").expect(404);
	});

	test("should exclude memberships to deleted archives", async () => {
		// account 2 has account_archive id=13 pointing to archive 4 (status.generic.deleted)
		const response = await agent.get("/api/v2/accounts/me").expect(200);
		const {
			body: { data: account },
		} = response as { body: { data: Account } };
		const archiveIds = account.archiveMemberships.map((m) => m.archive.id);
		expect(archiveIds).not.toContain("4");
	});

	test("should exclude memberships with non-ok status", async () => {
		// account 2 has account_archive id=21 to archive 3 with status.generic.pending
		const response = await agent.get("/api/v2/accounts/me").expect(200);
		const {
			body: { data: account },
		} = response as { body: { data: Account } };
		const archiveIds = account.archiveMemberships.map((m) => m.archive.id);
		expect(archiveIds).not.toContain("3");
	});

	test("should return all active memberships for an account with multiple archives", async () => {
		// account 3 (test+1) has ok memberships to archive 1 (viewer) and archive 2 (owner)
		mockVerifyUserAuthentication(
			"test+1@permanent.org",
			"553f3cb8-b753-43ce-83af-4443a404741b",
		);
		const response = await agent.get("/api/v2/accounts/me").expect(200);
		const {
			body: { data: account },
		} = response as { body: { data: Account } };
		expect(account.archiveMemberships).toHaveLength(2);
	});

	test("should return null archive name when no basic profile item exists", async () => {
		// account 3 has a membership to archive 2, which has no profile_item row
		mockVerifyUserAuthentication(
			"test+1@permanent.org",
			"553f3cb8-b753-43ce-83af-4443a404741b",
		);
		const response = await agent.get("/api/v2/accounts/me").expect(200);
		const {
			body: { data: account },
		} = response as { body: { data: Account } };
		const archive2Membership = account.archiveMemberships.find(
			(m) => m.archive.id === "2",
		);
		expect(archive2Membership).toBeDefined();
		expect(archive2Membership?.archive.name).toBeNull();
	});

	test("should map non-owner access roles correctly", async () => {
		// account 3 has access.role.viewer to archive 1
		mockVerifyUserAuthentication(
			"test+1@permanent.org",
			"553f3cb8-b753-43ce-83af-4443a404741b",
		);
		const response = await agent.get("/api/v2/accounts/me").expect(200);
		const {
			body: { data: account },
		} = response as { body: { data: Account } };
		const archive1Membership = account.archiveMemberships.find(
			(m) => m.archive.id === "1",
		);
		expect(archive1Membership?.accessRole).toBe("viewer");
	});

	test("should return empty archiveMemberships array for an account with no active memberships", async () => {
		// account 4 (test+2@permanent.org) has one account_archive with deleted status, so no active memberships
		mockVerifyUserAuthentication(
			"test+2@permanent.org",
			"13bb917e-7c75-4971-a8ee-b22e82432888",
		);
		const response = await agent.get("/api/v2/accounts/me").expect(200);
		const {
			body: { data: account },
		} = response as { body: { data: Account } };
		expect(account.archiveMemberships).toEqual([]);
	});

	test("should return 404 for accounts with invited status", async () => {
		// account 5 (test+3@permanent.org) has status.generic.invited; the query filters on status.auth.ok
		mockVerifyUserAuthentication(
			"test+3@permanent.org",
			"13bb917e-7c75-4971-a8ee-b22e82432888",
		);
		await agent.get("/api/v2/accounts/me").expect(404);
	});

	test("should return verified: true when the account email is verified", async () => {
		await db.query(
			"UPDATE account SET emailstatus = 'status.auth.ok' WHERE accountid = 2",
		);
		const response = await agent.get("/api/v2/accounts/me").expect(200);
		const {
			body: { data: account },
		} = response as { body: { data: Account } };
		expect(account.primaryEmail.verified).toBe(true);
	});

	test("should match lowercase email from the call to uppercase emails in the database", async () => {
		// account 6 is stored as TEST+4@permanent.org; query with lowercase
		mockVerifyUserAuthentication(
			"test+4@permanent.org",
			"13bb917e-7c75-4971-a8ee-b22e82432888",
		);
		const response = await agent.get("/api/v2/accounts/me").expect(200);
		const {
			body: { data: account },
		} = response as { body: { data: Account } };
		expect(account.id).toBe("6");
	});

	test("should match uppercase email from the call to lowercase emails in the database", async () => {
		mockVerifyUserAuthentication(
			"TEST@permanent.org",
			"13bb917e-7c75-4971-a8ee-b22e82432888",
		);
		const response = await agent.get("/api/v2/accounts/me").expect(200);
		const {
			body: { data: account },
		} = response as { body: { data: Account } };
		expect(account.id).toBe("2");
	});

	test("should log error and return 500 if account database query fails", async () => {
		const testError = new Error("test error");
		vi.spyOn(db, "sql").mockRejectedValueOnce(testError);

		await agent.get("/api/v2/accounts/me").expect(500);

		expect(logger.error).toHaveBeenCalledWith(testError);
	});
});
