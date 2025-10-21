import request from "supertest";
import { logger } from "@stela/logger";
import { app } from "../../app";
import { db } from "../../database";
import type { Archive } from "../models";
import {
	mockExtractUserIsAdminFromAuthToken,
	mockExtractUserEmailFromAuthToken,
} from "../../../test/middleware_mocks";

jest.mock("../../database");
jest.mock("@stela/logger");
jest.mock("../../middleware");

const loadFixtures = async (): Promise<void> => {
	await db.sql("archive.fixtures.create_test_accounts");
	await db.sql("archive.fixtures.create_test_archives");
	await db.sql("archive.fixtures.create_test_folders");
	await db.sql("archive.fixtures.create_test_text_data");
	await db.sql("archive.fixtures.create_test_profile_items");
	await db.sql("archive.fixtures.create_test_account_archives");
};

const clearDatabase = async (): Promise<void> => {
	await db.query(
		"TRUNCATE account, archive, folder, profile_item, text_data, account_archive CASCADE",
	);
};

describe("searchArchives", () => {
	const agent = request(app);

	beforeEach(async () => {
		await loadFixtures();
	});

	afterEach(async () => {
		await clearDatabase();
		jest.clearAllMocks();
	});

	test("should search archives without authentication and return only public archives", async () => {
		mockExtractUserIsAdminFromAuthToken(false);
		mockExtractUserEmailFromAuthToken(undefined);
		const result = await agent
			.get("/api/v2/archive?searchQuery=Rando&pageSize=1")
			.expect(200);

		const {
			body: { items, pagination },
		} = result as {
			body: {
				items: Archive[];
				pagination: {
					nextCursor: string | undefined;
					nextPage: string | undefined;
					totalPages: number;
				};
			};
		};
		expect(items).toHaveLength(1);
		expect(pagination.totalPages).toBe(2);
		expect(pagination.nextCursor).toBe("3");
		expect(pagination.nextPage).toBe(
			"https:///api/v2/archive?searchQuery=Rando&pageSize=1&cursor=3",
		);

		const [archive] = items;
		if (archive !== undefined) {
			expect(archive.archiveId).toBe("3");
			expect(archive.rootFolderId).toBe("102");
			expect(archive.name).toBe("Jay Rando");
			expect(archive.description).toBe(
				"This is Jay Rando's public archive description",
			);
			expect(archive.payerAccountId).toBeNull();
			expect(archive.public).toBe(true);
			expect(archive.publicAt).toBeNull();
			expect(archive.allowPublicDownload).toBe(true);
			expect(archive.thumbnailUrls).toEqual({
				width200: "https://test-archive-thumbnail",
				width500: null,
				width1000: null,
				width2000: null,
			});
			expect(archive.owner).toBeNull();
			expect(archive.status).toBe("status.generic.ok");
			expect(archive.type).toBe("type.archive.person");
			expect(archive.createdAt).toBeDefined();
			expect(archive.updatedAt).toBeDefined();
		}
	});

	test("should not return deleted archives", async () => {
		mockExtractUserIsAdminFromAuthToken(false);
		mockExtractUserEmailFromAuthToken(undefined);
		const result = await agent
			.get("/api/v2/archive?searchQuery=Janet&pageSize=10")
			.expect(200);

		const {
			body: { items },
		} = result as { body: { items: Archive[] } };
		expect(items).toHaveLength(0);
	});

	test("should return owner information for admin-authenticated requests", async () => {
		mockExtractUserIsAdminFromAuthToken(true);
		mockExtractUserEmailFromAuthToken(undefined);

		const result = await agent
			.get("/api/v2/archive?searchQuery=Jay&pageSize=10")
			.set("Authorization", "Bearer admin-token")
			.expect(200);

		const {
			body: { items },
		} = result as { body: { items: Archive[] } };
		expect(items[0]?.owner).not.toBeNull();
		expect(items[0]?.owner?.name).toBe("Jack Rando");
		expect(items[0]?.owner?.email).toBe("test@permanent.org");
	});

	test("should return callers private archives if caller is authenticated non-admin", async () => {
		mockExtractUserIsAdminFromAuthToken(false);
		mockExtractUserEmailFromAuthToken("test@permanent.org");

		const result = await agent
			.get("/api/v2/archive?searchQuery=Rando&pageSize=10")
			.set("Authorization", "Bearer user-token")
			.expect(200);

		const {
			body: { items },
		} = result as { body: { items: Archive[] } };
		expect(items).toHaveLength(3);
	});

	test("should not return callers private archives if caller is authenticated admin", async () => {
		mockExtractUserIsAdminFromAuthToken(true);
		mockExtractUserEmailFromAuthToken("test@permanent.org");

		const result = await agent
			.get("/api/v2/archive?searchQuery=Rando&pageSize=10")
			.set("Authorization", "Bearer user-token")
			.expect(200);

		const {
			body: { items },
		} = result as { body: { items: Archive[] } };
		expect(items).toHaveLength(2);
	});

	test("should populate archive description when present", async () => {
		mockExtractUserIsAdminFromAuthToken(false);
		mockExtractUserEmailFromAuthToken(undefined);

		const result = await agent
			.get("/api/v2/archive?searchQuery=Jay&pageSize=10")
			.expect(200);

		const {
			body: { items },
		} = result as { body: { items: Archive[] } };
		expect(items).toHaveLength(1);
		expect(items[0]?.archiveId).toBe("3");
		expect(items[0]?.name).toBe("Jay Rando");
		expect(items[0]?.description).toBe(
			"This is Jay Rando's public archive description",
		);
	});

	test("should return 400 if searchQuery is missing", async () => {
		mockExtractUserIsAdminFromAuthToken(false);
		mockExtractUserEmailFromAuthToken(undefined);
		await agent.get("/api/v2/archive").expect(400);
	});

	test("should throw InternalServerError if database query fails", async () => {
		mockExtractUserIsAdminFromAuthToken(false);
		mockExtractUserEmailFromAuthToken(undefined);
		const testError = new Error("error: out of cheese - redo from start");
		jest.spyOn(db, "sql").mockRejectedValueOnce(testError);
		await agent.get("/api/v2/archive?searchQuery=test&pageSize=10").expect(500);
		expect(logger.error).toHaveBeenCalledWith(testError);
	});
});
