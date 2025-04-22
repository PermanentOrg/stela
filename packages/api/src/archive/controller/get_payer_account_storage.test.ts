import request from "supertest";
import type { Request, NextFunction } from "express";
import { logger } from "@stela/logger";
import { app } from "../../app";
import { verifyUserAuthentication } from "../../middleware";
import { db } from "../../database";
import { GB } from "../../constants";
import type { AccountStorage } from "../models";

jest.mock("../../database");
jest.mock("../../middleware");
jest.mock("@stela/logger");

const loadFixtures = async (): Promise<void> => {
	await db.sql("archive.fixtures.create_test_accounts");
	await db.sql("archive.fixtures.create_test_archives");
	await db.sql("archive.fixtures.create_test_account_archives");
	await db.sql("archive.fixtures.create_test_account_space");
};

const clearDatabase = async (): Promise<void> => {
	await db.query(
		"TRUNCATE account, archive, account_archive, account_space CASCADE",
	);
};

describe("getPayerAccountStorage", () => {
	const agent = request(app);
	beforeEach(async () => {
		(verifyUserAuthentication as jest.Mock).mockImplementation(
			(req: Request, _: Response, next: NextFunction) => {
				(req.body as { emailFromAuthToken: string }).emailFromAuthToken =
					"test+1@permanent.org";
				(
					req.body as { userSubjectFromAuthToken: string }
				).userSubjectFromAuthToken = "82bd483e-914b-4bfe-abf9-92ffe86d7803";
				next();
			},
		);
		await clearDatabase();
		await loadFixtures();
	});
	afterEach(async () => {
		await clearDatabase();
		jest.clearAllMocks();
	});

	test("should return payer account storage", async () => {
		const response = await agent
			.get("/api/v2/archive/1/payer-account-storage")
			.expect(200);
		const payerAccountStorage = response.body as AccountStorage;
		expect(payerAccountStorage.accountId).toEqual("2");
		expect(+payerAccountStorage.spaceLeft).toEqual(2 * GB);
	});

	test("should throw a not found error if account can't access the archive", async () => {
		(verifyUserAuthentication as jest.Mock).mockImplementation(
			(req: Request, _: Response, next: NextFunction) => {
				(req.body as { emailFromAuthToken: string }).emailFromAuthToken =
					"test+2@permanent.org";
				(
					req.body as { userSubjectFromAuthToken: string }
				).userSubjectFromAuthToken = "82bd483e-914b-4bfe-abf9-92ffe86d7803";
				next();
			},
		);
		await agent.get("/api/v2/archive/1/payer-account-storage").expect(404);
	});

	test("should throw a not found error if archive has no payer account", async () => {
		await agent.get("/api/v2/archive/3/payer-account-storage").expect(404);
	});

	test("should throw a bad request error if the request is invalid", async () => {
		(verifyUserAuthentication as jest.Mock).mockImplementation(
			(req: Request, _: Response, next: NextFunction) => {
				(req.body as { emailFromAuthToken: string }).emailFromAuthToken =
					"test+1@permanent.org";
				next();
			},
		);
		await agent.get("/api/v2/archive/1/payer-account-storage").expect(400);
	});

	test("should throw an internal server error if database call fails", async () => {
		const testError = new Error("out of cheese - redo from start");
		jest.spyOn(db, "sql").mockRejectedValueOnce(testError);
		await agent.get("/api/v2/archive/2/payer-account-storage").expect(500);
		expect(logger.error).toHaveBeenCalledWith(testError);
	});
});
