import request from "supertest";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { logger } from "@stela/logger";
import { app } from "../../app.js";
import { db } from "../../database.js";
import type { SignupDetails } from "../models.js";
import { mockVerifyUserAuthentication } from "../../../test/middleware_mocks.js";

vi.mock("../../database");
vi.mock("../../middleware");
vi.mock("@stela/logger");

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
		mockVerifyUserAuthentication(
			"test@permanent.org",
			"b5461dc2-1eb0-450e-b710-fef7b2cafe1e",
		);
		await clearDatabase();
		await loadFixtures();
	});
	afterEach(async () => {
		vi.clearAllMocks();
		await clearDatabase();
	});

	test("should return an account's signup details", async () => {
		const response = await agent.get("/api/v2/accounts/signup").expect(200);
		const { body: signupDetails } = response as { body: SignupDetails };
		expect(signupDetails.token).toEqual("earlyb1rd");
	});

	test("should throw an error if the account does not exist", async () => {
		mockVerifyUserAuthentication(
			"not_an_account@permanent.org",
			"b5461dc2-1eb0-450e-b710-fef7b2cafe1e",
		);
		await agent.get("/api/v2/accounts/signup").expect(404);
	});

	test("should throw an error if the account has no signup details", async () => {
		mockVerifyUserAuthentication(
			"test+1@permanent.org",
			"b5461dc2-1eb0-450e-b710-fef7b2cafe1e",
		);
		await agent.get("/api/v2/accounts/signup").expect(404);
	});

	test("should throw an error if database call fails unexpectedly", async () => {
		vi.spyOn(db, "sql").mockImplementationOnce(
			vi
				.fn()
				.mockRejectedValueOnce(new Error("out of cheese - redo from start")),
		);
		await agent.get("/api/v2/accounts/signup").expect(500);
		expect(logger.error).toHaveBeenCalled();
	});

	test("should return a bad request error if the request is invalid", async () => {
		mockVerifyUserAuthentication("test+1@permanent.org");
		await agent.get("/api/v2/accounts/signup").expect(400);
	});
});
