import request from "supertest";
import { logger } from "@stela/logger";
import { app } from "../../app";
import { db } from "../../database";
import { archiveService } from "../service/index";
import { mockVerifyAdminAuthentication } from "../../../test/middleware_mocks";

jest.mock("../../database");
jest.mock("../../middleware");
jest.mock("@stela/logger");

const loadFixtures = async (): Promise<void> => {
	await db.sql("archive.fixtures.create_test_accounts");
	await db.sql("archive.fixtures.create_test_archives");
	await db.sql("archive.fixtures.create_test_featured_archives");
	await db.sql("archive.fixtures.create_test_folders");
	await db.sql("archive.fixtures.create_test_profile_items");
};

const clearDatabase = async (): Promise<void> => {
	await db.query(
		"TRUNCATE account, archive, featured_archive, folder, profile_item CASCADE",
	);
};

describe("getFeatured", () => {
	const agent = request(app);
	beforeEach(async () => {
		mockVerifyAdminAuthentication(
			"test+1@permanent.org",
			"82bd483e-914b-4bfe-abf9-92ffe86d7803",
		);
		await loadFixtures();
	});

	afterEach(async () => {
		await clearDatabase();
	});

	test("should remove archive from featured archives", async () => {
		const initialResult = await archiveService.getFeatured();
		expect(initialResult).toHaveLength(1);
		await agent.delete("/api/v2/archive/3/unfeature").expect(200);
		const result = await archiveService.getFeatured();
		expect(result).toHaveLength(0);
	});

	test("should throw InternalServerError if database query fails", async () => {
		const testError = new Error("error: out of cheese - redo from start");
		jest.spyOn(db, "sql").mockRejectedValueOnce(testError);
		await agent.delete("/api/v2/archive/3/unfeature").expect(500);
		expect(logger.error).toHaveBeenCalledWith(testError);
	});
});
