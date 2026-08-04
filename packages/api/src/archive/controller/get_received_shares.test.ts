import request from "supertest";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { NextFunction } from "express";
import createError from "http-errors";
import { logger } from "@stela/logger";
import { app } from "../../app.js";
import { verifyUserAuthentication } from "../../middleware/index.js";
import { db } from "../../database.js";
import type { GetReceivedSharesResponse } from "../models.js";
import { mockVerifyUserAuthentication } from "../../../test/middleware_mocks.js";

vi.mock("../../database");
vi.mock("../../middleware");
vi.mock("@stela/logger");

const loadFixtures = async (): Promise<void> => {
	await db.sql("archive.fixtures.create_test_accounts");
	await db.sql("archive.fixtures.create_test_archives");
	await db.sql("archive.fixtures.create_test_account_archives");
	await db.sql("archive.fixtures.create_test_profile_items");
	await db.sql("archive.fixtures.create_test_folders");
	await db.sql("archive.fixtures.create_test_folder_links");
	await db.sql("archive.fixtures.create_test_shares");
};

const clearDatabase = async (): Promise<void> => {
	await db.query(
		"TRUNCATE account, archive, account_archive, profile_item, folder, folder_link, share CASCADE",
	);
};

describe("getReceivedShares", () => {
	const agent = request(app);
	beforeEach(async () => {
		mockVerifyUserAuthentication(
			"test+1@permanent.org",
			"553f3cb8-b753-43ce-83af-4443a404741b",
		);
		await loadFixtures();
	});

	afterEach(async () => {
		await clearDatabase();
		vi.restoreAllMocks();
		vi.clearAllMocks();
	});

	test("should return received shares for an archive", async () => {
		const response = await agent
			.get(`/api/v2/archive/1/received-shares?pageSize=100`)
			.expect(200);

		const {
			body: { items: shares },
		} = response as { body: GetReceivedSharesResponse };
		expect(shares.map((share) => share.id)).toEqual(["3"]);
	});

	test("should return the correct share data", async () => {
		const response = await agent
			.get(`/api/v2/archive/1/received-shares?pageSize=100`)
			.expect(200);

		const {
			body: { items: shares },
		} = response as { body: GetReceivedSharesResponse };
		const [share] = shares;
		expect(share).toBeDefined();
		if (share === undefined) return;
		expect(share.item.id).toEqual("3");
		expect(share.item.itemType).toEqual("folder");
		expect(share.item.displayName).toEqual("Future Public Folder");
		expect(share.item.displayTime).toEqual("2026-08-01");
		expect(share.item.thumbnailUrls.width500).toEqual(
			"https://test-folder-thumbnail",
		);
		expect(share.accessRole).toEqual("viewer");
		expect(share.archive.id).toEqual("2");
		expect(share.archive.name).toEqual("Jane Rando");
		expect(share.archive.thumbnailUrls.width200).toEqual(
			"https://test-archive-thumbnail",
		);
		expect(share.status).toEqual("ok");
	});

	test("should return 401 when not authenticated", async () => {
		vi.mocked(verifyUserAuthentication).mockImplementation(
			async (_, __, next: NextFunction) => {
				next(new createError.Unauthorized("Invalid token"));
			},
		);

		await agent
			.get(`/api/v2/archive/1/received-shares?pageSize=100`)
			.expect(401);
	});

	test("should return 400 if the header data is missing", async () => {
		mockVerifyUserAuthentication();
		await agent
			.get(`/api/v2/archive/1/received-shares?pageSize=100`)
			.expect(400);
	});

	test("should return 400 if pageSize is missing", async () => {
		await agent.get(`/api/v2/archive/1/received-shares`).expect(400);
	});

	test("should return 500 if database query fails", async () => {
		const testError = new Error("error: database connection lost");
		vi.spyOn(db, "sql").mockRejectedValueOnce(testError);
		await agent
			.get(`/api/v2/archive/1/received-shares?pageSize=100`)
			.expect(500);
		expect(logger.error).toHaveBeenCalledWith(testError);
	});

	test("should not return received shares when the user is not a member of the archive", async () => {
		mockVerifyUserAuthentication(
			"test@permanent.org",
			"553f3cb8-b753-43ce-83af-4443a404741b",
		);
		const response = await agent
			.get(`/api/v2/archive/2/received-shares?pageSize=100`)
			.expect(200);

		const {
			body: { items: shares },
		} = response as { body: GetReceivedSharesResponse };
		expect(shares.length).toBe(0);
	});

	test("should not return deleted shares", async () => {
		const response = await agent
			.get(`/api/v2/archive/1/received-shares?pageSize=100`)
			.expect(200);

		const {
			body: { items: shares },
		} = response as { body: GetReceivedSharesResponse };
		const shareIds = shares.map((share) => share.id);
		expect(shareIds).not.toContain("2");
	});

	test("should not return shares of deleted items", async () => {
		const response = await agent
			.get(`/api/v2/archive/1/received-shares?pageSize=100`)
			.expect(200);

		const {
			body: { items: shares },
		} = response as { body: GetReceivedSharesResponse };
		const shareIds = shares.map((share) => share.id);
		expect(shareIds).not.toContain("4");
	});

	test("should not return received shares when archive membership has been deleted", async () => {
		const response = await agent
			.get(`/api/v2/archive/3/received-shares?pageSize=100`)
			.expect(200);

		const {
			body: { items: shares },
		} = response as { body: GetReceivedSharesResponse };
		expect(shares.length).toBe(0);
	});

	test("should respect pageSize limit", async () => {
		const response = await agent
			.get(`/api/v2/archive/1/received-shares?pageSize=1`)
			.expect(200);

		const { body } = response as { body: GetReceivedSharesResponse };
		expect(body.items).toHaveLength(1);
		expect(body.pagination.totalPages).toBeGreaterThanOrEqual(1);
	});

	test("should support cursor-based pagination", async () => {
		const firstResponse = await agent
			.get(`/api/v2/archive/1/received-shares?pageSize=1`)
			.expect(200);
		const { body: firstPage } = firstResponse as {
			body: GetReceivedSharesResponse;
		};
		expect(firstPage.items).toHaveLength(1);

		if (firstPage.pagination.nextCursor !== undefined) {
			const secondResponse = await agent
				.get(
					`/api/v2/archive/1/received-shares?pageSize=1&cursor=${firstPage.pagination.nextCursor}`,
				)
				.expect(200);
			const { body: secondPage } = secondResponse as {
				body: GetReceivedSharesResponse;
			};
			expect(secondPage.items).toHaveLength(0);
		}
	});
});
