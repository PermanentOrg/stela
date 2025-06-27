import request from "supertest";
import type { Request, NextFunction } from "express";
import createError from "http-errors";
import { logger } from "@stela/logger";
import { app } from "../../app";
import { verifyAdminAuthentication } from "../../middleware";
import { db } from "../../database";
import { publisherClient } from "../../publisher_client";

jest.mock("../../database");
jest.mock("../../middleware");
jest.mock("../../publisher_client");
jest.mock("@stela/logger");

const loadFixtures = async (): Promise<void> => {
	await db.sql("archive.fixtures.create_test_accounts");
	await db.sql("archive.fixtures.create_test_archives");
	await db.sql("archive.fixtures.create_test_records");
};

const clearDatabase = async (): Promise<void> => {
	await db.query("TRUNCATE account, archive, record CASCADE");
};

describe("POST /:archiveId/backfill-ledger", () => {
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
		jest.spyOn(publisherClient, "publishMessage").mockResolvedValue();
	});

	afterEach(async () => {
		await clearDatabase();
		jest.clearAllMocks();
	});

	test("should backfill ledger records successfully", async () => {
		await agent.post("/api/v2/archive/2/backfill-ledger").expect(200);

		const result = await db.query<{
			recordId: string;
			uploadPayerAccountId: string;
		}>(
			'SELECT recordid "recordId", uploadpayeraccountid "uploadPayerAccountId" FROM record WHERE archiveId = 2',
		);
		expect(result.rows.length).toBe(4);

		expect(publisherClient.publishMessage).toHaveBeenCalledTimes(
			result.rows.length,
		);
		result.rows.forEach((row) => {
			expect(row.uploadPayerAccountId).toBe("3");
			expect(publisherClient.publishMessage).toHaveBeenCalledWith(
				expect.any(String),
				{
					id: row.recordId,
					body: JSON.stringify({
						entity: "record",
						action: "create",
						body: {
							record: {
								recordId: row.recordId,
							},
						},
					}),
					attributes: { Entity: "record", Action: "create" },
				},
			);
		});
	});

	test("should require admin authentication", async () => {
		(verifyAdminAuthentication as jest.Mock).mockImplementation(
			(_: Request, __: Response, next: NextFunction) => {
				next(createError.Unauthorized("Invalid token"));
			},
		);

		await agent.post("/api/v2/archive/1/backfill-ledger").expect(401);
		expect(publisherClient.publishMessage).not.toHaveBeenCalled();
	});

	test("should handle a nonexistent archive ID", async () => {
		await agent.post("/api/v2/archive/1000/backfill-ledger").expect(200);
		expect(publisherClient.publishMessage).not.toHaveBeenCalled();
	});

	test("should handle database query errors", async () => {
		const testError = new Error("Database error");
		jest.spyOn(db, "sql").mockRejectedValueOnce(testError);

		await agent.post("/api/v2/archive/1/backfill-ledger").expect(500);
		expect(logger.error).toHaveBeenCalledWith(testError);
		expect(publisherClient.publishMessage).not.toHaveBeenCalled();
	});

	test("should handle publisher client errors", async () => {
		const testError = new Error("Publisher error");
		(publisherClient.publishMessage as jest.Mock).mockRejectedValueOnce(
			testError,
		);

		await agent.post("/api/v2/archive/1/backfill-ledger").expect(500);
		expect(logger.error).toHaveBeenCalledWith(testError);
	});
});
