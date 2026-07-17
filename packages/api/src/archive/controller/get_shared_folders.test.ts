import request from "supertest";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { NextFunction } from "express";
import createError from "http-errors";
import { logger } from "@stela/logger";
import { app } from "../../app";
import { verifyUserAuthentication } from "../../middleware";
import { db } from "../../database";
import type { GetSharedFoldersResponse } from "../models";
import { mockVerifyUserAuthentication } from "../../../test/middleware_mocks";

vi.mock("../../database");
vi.mock("../../middleware");
vi.mock("@stela/logger");

const loadFixtures = async (): Promise<void> => {
	await db.sql("archive.fixtures.create_test_accounts");
	await db.sql("archive.fixtures.create_test_archives");
	await db.sql("archive.fixtures.create_test_account_archives");
	await db.sql("archive.fixtures.create_test_folders");
	await db.sql("archive.fixtures.create_test_folder_links");
	await db.sql("archive.fixtures.create_test_shares");
};

const clearDatabase = async (): Promise<void> => {
	await db.query(
		"TRUNCATE account, archive, account_archive, folder, folder_link, share CASCADE",
	);
};

describe("getSharedFolders", () => {
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

	test("should return shared folders for an archive", async () => {
		const response = await agent
			.get(`/api/v2/archive/2/folders/shared?pageSize=100`)
			.expect(200);

		const {
			body: { items: folders },
		} = response as { body: GetSharedFoldersResponse };
		expect(folders.map((folder) => folder.folderId)).toEqual(["3", "200"]);
	});

	test("should return 401 when not authenticated", async () => {
		vi.mocked(verifyUserAuthentication).mockImplementation(
			async (_, __, next: NextFunction) => {
				next(new createError.Unauthorized("Invalid token"));
			},
		);

		await agent
			.get(`/api/v2/archive/2/folders/shared?pageSize=100`)
			.expect(401);
	});

	test("should return 400 if the header data is missing", async () => {
		mockVerifyUserAuthentication();
		await agent
			.get(`/api/v2/archive/2/folders/shared?pageSize=100`)
			.expect(400);
	});

	test("should return 400 if pageSize is missing", async () => {
		await agent.get(`/api/v2/archive/2/folders/shared`).expect(400);
	});

	test("should return 500 if database query fails", async () => {
		const testError = new Error("error: database connection lost");
		vi.spyOn(db, "sql").mockRejectedValueOnce(testError);
		await agent
			.get(`/api/v2/archive/2/folders/shared?pageSize=100`)
			.expect(500);
		expect(logger.error).toHaveBeenCalledWith(testError);
	});

	test("should not return shared folders for an archive if the user is not a member", async () => {
		mockVerifyUserAuthentication(
			"test@permanent.org",
			"553f3cb8-b753-43ce-83af-4443a404741b",
		);
		const response = await agent
			.get(`/api/v2/archive/2/folders/shared?pageSize=100`)
			.expect(200);

		const {
			body: { items: folders },
		} = response as { body: GetSharedFoldersResponse };
		expect(folders.length).toBe(0);
	});

	test("should not return folders where the share has been deleted", async () => {
		const response = await agent
			.get(`/api/v2/archive/1/folders/shared?pageSize=100`)
			.expect(200);

		const {
			body: { items: folders },
		} = response as { body: GetSharedFoldersResponse };
		expect(folders.length).toBe(0);
	});

	test("should not return folders where archive membership has been deleted", async () => {
		const response = await agent
			.get(`/api/v2/archive/3/folders/shared?pageSize=100`)
			.expect(200);

		const {
			body: { items: folders },
		} = response as { body: GetSharedFoldersResponse };
		expect(folders.length).toBe(0);
	});

	test("expect no more than pageSize items to be returned", async () => {
		const response = await agent
			.get(`/api/v2/archive/2/folders/shared?pageSize=1`)
			.expect(200);

		const { body } = response as { body: GetSharedFoldersResponse };
		expect(body.items).toHaveLength(1);
		expect(body.items[0]?.folderId).toEqual("3");
		expect(body.pagination.totalPages).toEqual(2);
		expect(body.pagination.nextCursor).toEqual("3");
	});

	test("expect to page through all shared folders via cursor, in ascending folderId order", async () => {
		const firstResponse = await agent
			.get(`/api/v2/archive/2/folders/shared?pageSize=1`)
			.expect(200);
		const { body: firstPage } = firstResponse as {
			body: GetSharedFoldersResponse;
		};
		expect(firstPage.items.map((folder) => folder.folderId)).toEqual(["3"]);
		expect(firstPage.pagination.totalPages).toEqual(2);
		expect(firstPage.pagination.nextCursor).toBeDefined();

		const secondResponse = await agent
			.get(
				`/api/v2/archive/2/folders/shared?pageSize=1&cursor=${firstPage.pagination.nextCursor}`,
			)
			.expect(200);
		const { body: secondPage } = secondResponse as {
			body: GetSharedFoldersResponse;
		};
		expect(secondPage.items.map((folder) => folder.folderId)).toEqual(["200"]);
		expect(secondPage.pagination.totalPages).toEqual(2);
	});

	test("expect pagination.nextPage to link to the next page with the same filters", async () => {
		const response = await agent
			.get(`/api/v2/archive/2/folders/shared?pageSize=1`)
			.expect(200);
		const { body } = response as { body: GetSharedFoldersResponse };
		expect(body.pagination.nextPage).toEqual(
			`https://${process.env["SITE_URL"] ?? ""}/api/v2/archives/2/folders/shared?pageSize=1&cursor=${
				body.pagination.nextCursor ?? ""
			}`,
		);
	});
});
