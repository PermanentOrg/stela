import type { NextFunction } from "express";
import {
	afterAll,
	afterEach,
	beforeEach,
	describe,
	expect,
	test,
	vi,
} from "vitest";
import request from "supertest";
import { logger } from "@stela/logger";
import createError from "http-errors";
import { app } from "../../app.js";
import { db } from "../../database.js";
import { verifyUserAuthentication } from "../../middleware/index.js";
import type { ShareLink } from "../../share_link/models.js";
import { mockVerifyUserAuthentication } from "../../../test/middleware_mocks.js";
import { runFixtures } from "../../../test/run_fixtures.js";

vi.mock("../../database");
vi.mock("../../middleware");
vi.mock("@stela/logger");

export const loadFixtures = async (): Promise<void> => {
	await runFixtures(db, [
		"folder.fixtures.create_test_accounts",
		"folder.fixtures.create_test_archives",
		"folder.fixtures.create_test_account_archives",
		"folder.fixtures.create_test_locations",
		"folder.fixtures.create_test_folders",
		"folder.fixtures.create_test_records",
		"folder.fixtures.create_test_files",
		"folder.fixtures.create_test_record_files",
		"folder.fixtures.create_test_folder_links",
		"folder.fixtures.create_test_shareby_urls",
		"folder.fixtures.create_test_accesses",
		"folder.fixtures.create_test_folder_sizes",
		"folder.fixtures.create_test_shares",
		"folder.fixtures.create_test_profile_items",
		"folder.fixtures.create_test_tags",
		"folder.fixtures.create_test_tag_links",
		"folder.fixtures.create_test_invite_shares",
	]);
};

export const clearDatabase = async (): Promise<void> => {
	await db.query(
		`TRUNCATE
      event,
      account_archive,
      account,
      archive,
      folder,
      folder_link,
      shareby_url,
      access,
      folder_size,
      locn,
      share,
      profile_item,
      tag,
      tag_link,
      record,
      file,
      record_file,
      invite,
      invite_share
    CASCADE`,
	);
};

describe("GET /folder/{id}/share_links", () => {
	const agent = request(app);

	beforeEach(async () => {
		mockVerifyUserAuthentication(
			"test@permanent.org",
			"b5461dc2-1eb0-450e-b710-fef7b2cafe1e",
		);
		await clearDatabase();
		await loadFixtures();
	});

	afterEach(async () => {
		vi.restoreAllMocks();
		vi.clearAllMocks();
	});

	afterAll(async () => {
		await clearDatabase();
	});

	test("expect to return share links for a folder", async () => {
		const response = await agent
			.get("/api/v2/folders/2/share_links")
			.expect(200);

		const {
			body: { items: shareLinks },
		} = response as { body: { items: ShareLink[] } };
		expect(shareLinks.length).toEqual(3);

		const shareLink = shareLinks.find((link) => link.id === "1");
		expect(shareLink?.id).toEqual("1");
		expect(shareLink?.itemId).toEqual("2");
		expect(shareLink?.itemType).toEqual("folder");
		expect(shareLink?.token).toEqual("c0f523e4-48d8-4c39-8cda-5e95161532e4");
		expect(shareLink?.permissionsLevel).toEqual("viewer");
		expect(shareLink?.accessRestrictions).toEqual("none");
		expect(shareLink?.maxUses).toEqual(null);
		expect(shareLink?.usesExpended).toEqual(null);
		expect(shareLink?.expirationTimestamp).toEqual(null);
	});

	test("expect an empty list if folder doesn't exist", async () => {
		const response = await agent
			.get("/api/v2/folders/999/share_links")
			.expect(200);

		const {
			body: { items: shareLinks },
		} = response as { body: { items: ShareLink[] } };
		expect(shareLinks.length).toEqual(0);
	});

	test("expect empty list if user doesn't have access to the folder's share links", async () => {
		mockVerifyUserAuthentication(
			"test+1@permanent.org",
			"b5461dc2-1eb0-450e-b710-fef7b2cafe1e",
		);
		const response = await agent
			.get("/api/v2/folders/2/share_links")
			.expect(200);

		const {
			body: { items: shareLinks },
		} = response as { body: { items: ShareLink[] } };
		expect(shareLinks.length).toEqual(0);
	});

	test("expect to log error and return 500 if database lookup fails", async () => {
		const testError = new Error("test error");
		vi.spyOn(db, "sql").mockImplementation(async () => {
			throw testError;
		});

		await agent.get("/api/v2/folders/1/share_links").expect(500);
		expect(logger.error).toHaveBeenCalledWith(testError);
	});

	test("expect 401 if not authenticated", async () => {
		vi.mocked(verifyUserAuthentication).mockImplementation(
			async (_, __, next: NextFunction) => {
				next(createError.Unauthorized("Invalid auth token"));
			},
		);
		await agent.get("/api/v2/folders/1/share_links").expect(401);
	});

	test("expect 400 if the header values are missing", async () => {
		mockVerifyUserAuthentication();
		await agent.get("/api/v2/folders/1/share_links").expect(400);
	});
});
