import request from "supertest";
import type { Request, NextFunction } from "express";
import { logger } from "@stela/logger";
import { app } from "../../app";
import { db } from "../../database";
import { verifyUserAuthentication } from "../../middleware";
import type { SignupDetails } from "../models";

jest.mock("../../database");
jest.mock("../../middleware");
jest.mock("@stela/logger");

const loadFixtures = async (): Promise<void> => {
	await db.sql("account.fixtures.create_test_accounts");
	await db.sql("account.fixtures.create_test_invites");
};

const clearDatabase = async (): Promise<void> => {
	await db.query("TRUNCATE account, invite CASCADE");
};
describe("getSignupDetails", () => {
	const agent = request(app);
	beforeEach(async () => {
		(verifyUserAuthentication as jest.Mock).mockImplementation(
			async (
				req: Request<
					unknown,
					unknown,
					{ userSubjectFromAuthToken?: string; emailFromAuthToken?: string }
				>,
				__,
				next: NextFunction,
			) => {
				req.body = {
					emailFromAuthToken: "test@permanent.org",
					userSubjectFromAuthToken: "b5461dc2-1eb0-450e-b710-fef7b2cafe1e",
				};

				next();
			},
		);
		await clearDatabase();
		await loadFixtures();
	});
	afterEach(async () => {
		jest.clearAllMocks();
		await clearDatabase();
	});

	test("should return an account's signup details", async () => {
		const response = await agent.get("/api/v2/account/signup").expect(200);
		const signupDetails = response.body as SignupDetails;
		expect(signupDetails.token).toEqual("earlyb1rd");
	});

	test("should throw an error if the account does not exist", async () => {
		(verifyUserAuthentication as jest.Mock).mockImplementation(
			async (
				req: Request<
					unknown,
					unknown,
					{ userSubjectFromAuthToken?: string; emailFromAuthToken?: string }
				>,
				__,
				next: NextFunction,
			) => {
				req.body = {
					emailFromAuthToken: "not_an_account@permanent.org",
					userSubjectFromAuthToken: "b5461dc2-1eb0-450e-b710-fef7b2cafe1e",
				};

				next();
			},
		);
		await agent.get("/api/v2/account/signup").expect(404);
	});

	test("should throw an error if the account has no signup details", async () => {
		(verifyUserAuthentication as jest.Mock).mockImplementation(
			async (
				req: Request<
					unknown,
					unknown,
					{ userSubjectFromAuthToken?: string; emailFromAuthToken?: string }
				>,
				__,
				next: NextFunction,
			) => {
				req.body = {
					emailFromAuthToken: "test+1@permanent.org",
					userSubjectFromAuthToken: "b5461dc2-1eb0-450e-b710-fef7b2cafe1e",
				};

				next();
			},
		);
		await agent.get("/api/v2/account/signup").expect(404);
	});

	test("should throw an error if database call fails unexpectedly", async () => {
		jest.spyOn(db, "sql").mockImplementationOnce((async () => {
			throw new Error("out of cheese - redo from start");
		}) as unknown as typeof db.sql);
		await agent.get("/api/v2/account/signup").expect(500);
		expect(logger.error).toHaveBeenCalled();
	});

	test("should return a bad request error if the request is invalid", async () => {
		(verifyUserAuthentication as jest.Mock).mockImplementation(
			async (
				req: Request<
					unknown,
					unknown,
					{ userSubjectFromAuthToken?: string; emailFromAuthToken?: string }
				>,
				__,
				next: NextFunction,
			) => {
				req.body = { emailFromAuthToken: "test+1@permanent.org" };

				next();
			},
		);
		await agent.get("/api/v2/account/signup").expect(400);
	});
});
