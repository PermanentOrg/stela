import request from "supertest";
import type { Request, NextFunction } from "express";
import { logger } from "@stela/logger";
import { app } from "../../app";
import { verifyAdminAuthentication } from "../../middleware";
import { db } from "../../database";

jest.mock("../../database");
jest.mock("../../middleware");
jest.mock("@stela/logger");

const loadFixtures = async (): Promise<void> => {
	await db.sql("archive.fixtures.create_test_accounts");
	await db.sql("archive.fixtures.create_test_archives");
};

const clearDatabase = async (): Promise<void> => {
	await db.query("TRUNCATE account, archive, featured_archive CASCADE");
};

describe("makeFeatured", () => {
	const agent = request(app);
	beforeEach(async () => {
		(verifyAdminAuthentication as jest.Mock).mockImplementation(
			(req: Request, _: Response, next: NextFunction) => {
				req.body = {
					emailFromAuthToken: "test+1@permanent.org",
					adminSubjectFromAuthToken: "82bd483e-914b-4bfe-abf9-92ffe86d7803",
				};
				next();
			},
		);
		await loadFixtures();
	});

	afterEach(async () => {
		await clearDatabase();
	});

	test("should make an archive featured", async () => {
		const archiveId = "3";

		await agent.post(`/api/v2/archive/${archiveId}/make-featured`).expect(200);

		const result = await db.query<{ archiveId: string }>(
			'SELECT archive_id "archiveId" FROM featured_archive WHERE archive_id = :archiveId',
			{ archiveId },
		);
		expect(result.rows[0]).toBeDefined();
		expect(result.rows[0]?.archiveId).toBe(archiveId);
	});

	test("should throw a BadRequest error if archive doesn't exist", async () => {
		const archiveId = "1000000";
		await agent.post(`/api/v2/archive/${archiveId}/make-featured`).expect(400);
	});

	test("should throw a BadRequest error if archive isn't public", async () => {
		const archiveId = "1";
		await agent.post(`/api/v2/archive/${archiveId}/make-featured`).expect(400);
	});

	test("should throw a BadRequest error if archive is already featured", async () => {
		const archiveId = "3";
		await agent.post(`/api/v2/archive/${archiveId}/make-featured`).expect(200);
		await agent.post(`/api/v2/archive/${archiveId}/make-featured`).expect(400);
	});

	test("should throw an InternalServerError if database query fails", async () => {
		const archiveId = "3";
		const testError = new Error("error: out of cheese - redo from start");
		jest.spyOn(db, "sql").mockRejectedValueOnce(testError);
		await agent.post(`/api/v2/archive/${archiveId}/make-featured`).expect(500);
		expect(logger.error).toHaveBeenCalledWith(testError);
	});
});
