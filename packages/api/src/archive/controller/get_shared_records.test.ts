import request from "supertest";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { NextFunction } from "express";
import createError from "http-errors";
import { logger } from "@stela/logger";
import { app } from "../../app.js";
import { verifyUserAuthentication } from "../../middleware/index.js";
import { db } from "../../database.js";
import type { GetRecordsResponse } from "../../record/models.js";
import { mockVerifyUserAuthentication } from "../../../test/middleware_mocks.js";
import { runFixtures } from "../../../test/run_fixtures.js";

vi.mock("../../database");
vi.mock("../../middleware");
vi.mock("@stela/logger");

const loadFixtures = async (): Promise<void> => {
	await runFixtures(db, [
		"record.fixtures.create_test_accounts",
		"record.fixtures.create_test_archives",
		"record.fixtures.create_test_account_archives",
		"record.fixtures.create_test_records",
		"record.fixtures.create_complete_test_record",
		"record.fixtures.create_test_folders",
		"record.fixtures.create_test_folder_links",
		"record.fixtures.create_complete_test_folder_links",
		"record.fixtures.create_test_files",
		"record.fixtures.create_complete_test_files",
		"record.fixtures.create_test_record_files",
		"record.fixtures.create_test_shares",
		"record.fixtures.create_test_profile_items",
	]);
};

const clearDatabase = async (): Promise<void> => {
	await db.query(
		"TRUNCATE account, archive, account_archive, record, folder, folder_link, file, share, profile_item CASCADE",
	);
};

describe("GET /archive/:archiveId/records/shared", () => {
	const agent = request(app);
	beforeEach(async () => {
		mockVerifyUserAuthentication(
			"test@permanent.org",
			"b5461dc2-1eb0-450e-b710-fef7b2cafe1e",
		);
		await loadFixtures();
	});

	afterEach(async () => {
		await clearDatabase();
		vi.restoreAllMocks();
		vi.clearAllMocks();
	});

	test("should return shared records for an archive", async () => {
		const response = await agent
			.get(`/api/v2/archive/1/records/shared?pageSize=100`)
			.expect(200);

		const { body } = response as { body: GetRecordsResponse };
		expect(body.items.map((record) => record.recordId)).toEqual([
			"10002",
			"10008",
		]);
	});

	test("should return 401 when not authenticated", async () => {
		vi.mocked(verifyUserAuthentication).mockImplementation(
			async (_, __, next: NextFunction) => {
				next(new createError.Unauthorized("Invalid token"));
			},
		);

		await agent
			.get(`/api/v2/archive/1/records/shared?pageSize=100`)
			.expect(401);
	});

	test("should return 400 if the header data is missing", async () => {
		mockVerifyUserAuthentication();
		await agent
			.get(`/api/v2/archive/1/records/shared?pageSize=100`)
			.expect(400);
	});

	test("should return 400 if pageSize is missing", async () => {
		await agent.get(`/api/v2/archive/1/records/shared`).expect(400);
	});

	test("should return 500 if database query fails", async () => {
		const testError = new Error("error: database connection lost");
		vi.spyOn(db, "sql").mockRejectedValueOnce(testError);
		await agent
			.get(`/api/v2/archive/1/records/shared?pageSize=100`)
			.expect(500);
		expect(logger.error).toHaveBeenCalledWith(testError);
	});

	test("should not return shared records if the user is not a member of the archive", async () => {
		mockVerifyUserAuthentication(
			"test+2@permanent.org",
			"8b5b0f1a-7a6f-4c4e-9a43-1f1f0b6f2b1d",
		);
		const response = await agent
			.get(`/api/v2/archive/1/records/shared?pageSize=100`)
			.expect(200);

		const { body } = response as { body: GetRecordsResponse };
		expect(body.items).toEqual([]);
		expect(body.pagination.totalPages).toEqual(0);
	});

	test("should page through shared records via cursor, in ascending recordId order", async () => {
		const firstResponse = await agent
			.get(`/api/v2/archive/1/records/shared?pageSize=1`)
			.expect(200);
		const { body: firstPage } = firstResponse as { body: GetRecordsResponse };
		expect(firstPage.items.map((record) => record.recordId)).toEqual(["10002"]);
		expect(firstPage.pagination.totalPages).toEqual(2);
		expect(firstPage.pagination.nextCursor).toEqual("10002");
		expect(firstPage.pagination.nextPage).toEqual(
			`https://${process.env["SITE_URL"] ?? ""}/api/v2/archives/1/records/shared?pageSize=1&cursor=10002`,
		);

		const secondResponse = await agent
			.get(`/api/v2/archive/1/records/shared?pageSize=1&cursor=10002`)
			.expect(200);
		const { body: secondPage } = secondResponse as {
			body: GetRecordsResponse;
		};
		expect(secondPage.items.map((record) => record.recordId)).toEqual([
			"10008",
		]);
	});
});
