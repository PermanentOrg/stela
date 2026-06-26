import type { NextFunction } from "express";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import createError from "http-errors";
import { logger } from "@stela/logger";
import request from "supertest";
import { app } from "../../app";
import { db } from "../../database";
import { verifyUserAuthentication } from "../../middleware";
import type { ShareLink } from "../../share_link/models";
import { mockVerifyUserAuthentication } from "../../../test/middleware_mocks";

vi.mock("../../database");
vi.mock("../../middleware");
vi.mock("@stela/logger");

const setupDatabase = async (): Promise<void> => {
	await db.sql("record.fixtures.create_test_accounts");
	await db.sql("record.fixtures.create_test_archives");
	await db.sql("record.fixtures.create_test_account_archives");
	await db.sql("record.fixtures.create_test_locations");
	await db.sql("record.fixtures.create_test_records");
	await db.sql("record.fixtures.create_complete_test_record");
	await db.sql("record.fixtures.create_test_folders");
	await db.sql("record.fixtures.create_test_folder_links");
	await db.sql("record.fixtures.create_test_accesses");
	await db.sql("record.fixtures.create_test_files");
	await db.sql("record.fixtures.create_complete_test_files");
	await db.sql("record.fixtures.create_test_record_files");
	await db.sql("record.fixtures.create_test_tags");
	await db.sql("record.fixtures.create_test_tag_links");
	await db.sql("record.fixtures.create_test_shares");
	await db.sql("record.fixtures.create_test_profile_items");
	await db.sql("record.fixtures.create_complete_test_folder_links");
	await db.sql("record.fixtures.create_test_shareby_urls");
	await db.sql("record.fixtures.create_test_invite_shares");
	await db.sql("record.fixtures.create_test_account_space");
	await db.sql("record.fixtures.create_test_archive_nbr");
};

const clearDatabase = async (): Promise<void> => {
	await db.query(
		`TRUNCATE
			account,
			archive,
			account_archive,
			record,
			folder,
			folder_link,
			locn,
			access,
			tag,
			tag_link,
			share,
			shareby_url,
			profile_item,
			invite,
			invite_share,
			archive_nbr,
			file CASCADE`,
	);
};

describe("GET /records/{id}/share-links", () => {
	const agent = request(app);

	beforeEach(async () => {
		mockVerifyUserAuthentication(
			"test@permanent.org",
			"b5461dc2-1eb0-450e-b710-fef7b2cafe1e",
		);
		await clearDatabase();
		await setupDatabase();
	});

	afterEach(async () => {
		await clearDatabase();
		vi.restoreAllMocks();
		vi.clearAllMocks();
	});

	test("expect to return share links for a record", async () => {
		const response = await agent
			.get("/api/v2/records/10002/share-links")
			.expect(200);

		const {
			body: { items: shareLinks },
		} = response as { body: { items: ShareLink[] } };
		expect(shareLinks.length).toEqual(3);

		const shareLink = shareLinks.find((link) => link.id === "1");
		expect(shareLink?.id).toEqual("1");
		expect(shareLink?.itemId).toEqual("10002");
		expect(shareLink?.itemType).toEqual("record");
		expect(shareLink?.token).toEqual("2849c711-e72e-41b5-bb49-b0b86a052668");
		expect(shareLink?.permissionsLevel).toEqual("viewer");
		expect(shareLink?.accessRestrictions).toEqual("none");
		expect(shareLink?.maxUses).toEqual(null);
		expect(shareLink?.usesExpended).toEqual(null);
		expect(shareLink?.expirationTimestamp).toEqual(null);
	});

	test("expect an empty list if record doesn't exist", async () => {
		const response = await agent
			.get("/api/v2/records/999/share-links")
			.expect(200);

		const {
			body: { items: shareLinks },
		} = response as { body: { items: ShareLink[] } };
		expect(shareLinks.length).toEqual(0);
	});

	test("expect empty list if user doesn't have access to the record's share links", async () => {
		const response = await agent
			.get("/api/v2/records/10006/share-links")
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

		await agent.get("/api/v2/records/10001/share-links").expect(500);
		expect(logger.error).toHaveBeenCalledWith(testError);
	});

	test("expect 401 if not authenticated", async () => {
		vi.mocked(verifyUserAuthentication).mockImplementation(
			async (_, __, next: NextFunction) => {
				next(createError.Unauthorized("Invalid auth token"));
			},
		);
		await agent.get("/api/v2/records/10001/share-links").expect(401);
	});

	test("expect 400 if the header values are missing", async () => {
		mockVerifyUserAuthentication();
		await agent.get("/api/v2/records/10001/share-links").expect(400);
	});
});
