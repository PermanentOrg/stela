import request from "supertest";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { NextFunction } from "express";
import createError from "http-errors";
import { logger } from "@stela/logger";
import { app } from "../../app.js";
import { db } from "../../database.js";
import { verifyUserAuthentication } from "../../middleware/index.js";
import { mockVerifyUserAuthentication } from "../../../test/middleware_mocks.js";
import {
	ArchiveMembershipRole,
	ArchiveStatus,
	ArchiveType,
	type Archive,
} from "../models.js";
import { runFixtures } from "../../../test/run_fixtures.js";

vi.mock("../../database");
vi.mock("../../middleware");
vi.mock("@stela/logger");

const loadFixtures = async (): Promise<void> => {
	await runFixtures(db, [
		"archive.fixtures.create_test_accounts",
		"archive.fixtures.create_test_archives",
		"archive.fixtures.create_test_account_archives",
		"archive.fixtures.create_test_profile_items",
		"archive.fixtures.create_test_text_data",
		"archive.fixtures.create_test_folders",
	]);
};

const clearDatabase = async (): Promise<void> => {
	await db.query(
		"TRUNCATE account, archive, account_archive, profile_item, text_data, folder CASCADE",
	);
};

describe("GET /archive/:archiveId", () => {
	const agent = request(app);

	beforeEach(async () => {
		mockVerifyUserAuthentication(
			"test@permanent.org",
			"82bd483e-914b-4bfe-abf9-92ffe86d7803",
		);
		await loadFixtures();
	});

	afterEach(async () => {
		await clearDatabase();
		vi.clearAllMocks();
	});

	test("should return an archive the caller owns", async () => {
		const response = await agent.get("/api/v2/archive/1").expect(200);

		const {
			body: { data: archive },
		} = response as { body: { data: Archive } };
		expect(archive.id).toBe("1");
		expect(archive.rootFolderId).toBe("100");
		expect(archive.name).toBe("Jack Rando");
		expect(archive.description).toBe(
			"This is Jack Rando's archive description",
		);
		expect(archive.public).toBe(false);
		expect(archive.callerMembershipRole).toBe(ArchiveMembershipRole.Owner);
		expect(archive.thumbnailUrls.width200).toBe(
			"https://test-archive-thumbnail",
		);
		expect(archive.status).toBe(ArchiveStatus.Ok);
		expect(archive.type).toBe(ArchiveType.Person);
		expect(archive.allowPublicDownload).toBe(true);
		expect(archive.payerAccountId).toBe("2");
		expect(archive.milestoneSortOrder).toBe("reverse_chronological");
		expect(archive.createdAt).toBe("2026-08-06T00:00:00.000Z");
		expect(archive.updatedAt).toBe("2026-08-06T00:00:00.000Z");
	});

	test("should return a public archive even if the caller is not a member", async () => {
		mockVerifyUserAuthentication(
			"test+2@permanent.org",
			"aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
		);

		const response = await agent.get("/api/v2/archive/3").expect(200);

		const {
			body: { data: archive },
		} = response as { body: { data: Archive } };
		expect(archive.id).toBe("3");
		expect(archive.public).toBe(true);
		expect(archive.callerMembershipRole).toBeNull();
	});

	test("should return 404 if the archive is private and the caller is not a member", async () => {
		mockVerifyUserAuthentication(
			"test+2@permanent.org",
			"aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
		);

		await agent.get("/api/v2/archive/2").expect(404);
	});

	test("should return 404 if the archive doesn't exist", async () => {
		await agent.get("/api/v2/archive/1000000").expect(404);
	});

	test("should return 404 if the archive is deleted", async () => {
		await agent.get("/api/v2/archive/4").expect(404);
	});

	test("should return 401 if the caller is not authenticated", async () => {
		vi.mocked(verifyUserAuthentication).mockImplementation(
			async (_, __, next: NextFunction) => {
				next(createError.Unauthorized("Invalid token"));
			},
		);

		await agent.get("/api/v2/archive/1").expect(401);
	});

	test("should return 400 if the request is invalid", async () => {
		mockVerifyUserAuthentication("test@permanent.org");
		await agent.get("/api/v2/archive/1").expect(400);
	});

	test("should throw an InternalServerError if the database query fails", async () => {
		const testError = new Error("error: out of cheese - redo from start");
		vi.spyOn(db, "sql").mockRejectedValueOnce(testError);

		await agent.get("/api/v2/archive/1").expect(500);
		expect(logger.error).toHaveBeenCalledWith(testError);
	});
});
