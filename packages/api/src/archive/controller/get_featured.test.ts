import request from "supertest";
import { logger } from "@stela/logger";
import { app } from "../../app";
import { db } from "../../database";
import type { FeaturedArchive } from "../models";

jest.mock("../../database");
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
		await loadFixtures();
	});

	afterEach(async () => {
		await clearDatabase();
	});

	test("should retrieve featured archives", async () => {
		const result = await agent.get("/api/v2/archive/featured").expect(200);
		expect(result.body).toHaveLength(1);
		const {
			body: [archive],
		} = result as { body: FeaturedArchive[] };
		expect(archive?.archiveId).toBe("3");
		expect(archive?.name).toBe("Jay Rando");
		expect(archive?.type).toBe("type.archive.person");
		expect(archive?.archiveNbr).toBe("0001-0003");
		expect(archive?.profileImage).toBe("https://test-archive-thumbnail");
		expect(archive?.bannerImage).toBe("https://test-folder-thumbnail");
	});

	test("should throw InternalServerError if database query fails", async () => {
		const testError = new Error("error: out of cheese - redo from start");
		jest.spyOn(db, "sql").mockRejectedValueOnce(testError);
		await agent.get("/api/v2/archive/featured").expect(500);
		expect(logger.error).toHaveBeenCalledWith(testError);
	});
});
