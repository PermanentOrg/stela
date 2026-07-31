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
import { runFixtures } from "../../../test/run_fixtures.js";

vi.mock("../../database");
vi.mock("@stela/logger");

const loadFixtures = async (): Promise<void> => {
	await runFixtures(db, [
		"archive.fixtures.create_test_accounts",
		"archive.fixtures.create_test_archives",
		"archive.fixtures.create_test_records",
		"archive.fixtures.create_test_folders",
		"archive.fixtures.create_test_tags",
		"archive.fixtures.create_test_tag_links",
	]);
};

const clearDatabase = async (): Promise<void> => {
	await db.query(
		"TRUNCATE account, archive, record, folder, tag, tag_link CASCADE",
	);
};

describe("getPublicTags", () => {
	const agent = request(app);
	beforeEach(async () => {
		await clearDatabase();
		await loadFixtures();
	});
	afterEach(async () => {
		vi.clearAllMocks();
	});

	afterAll(async () => {
		await clearDatabase();
	});

	test("should return public tags and not private or deleted tags", async () => {
		const response = await agent
			.get("/api/v2/archive/1/tags/public")
			.expect(200);
		const tags: unknown = response.body;
		expect(Array.isArray(tags)).toBe(true);
		if (Array.isArray(tags)) {
			expect(tags.length).toEqual(2);
			expect(tags.map((tag: { name: string }) => tag.name)).toContain(
				"test_public_file",
			);
			expect(tags.map((tag: { name: string }) => tag.name)).toContain(
				"test_public_folder",
			);
		}
	});

	test("should return empty list for nonexistent archive", async () => {
		const response = await agent
			.get("/api/v2/archive/1000/tags/public")
			.expect(200);
		expect(response.body).toEqual([]);
	});

	test("should throw an internal server error if database query fails unexpectedly", async () => {
		const testError = new Error("out of cheese - redo from start");
		vi.spyOn(db, "sql").mockRejectedValueOnce(testError);
		await agent.get("/api/v2/archive/1/tags/public").expect(500);
		expect(logger.error).toHaveBeenCalledWith(testError);
	});
});
