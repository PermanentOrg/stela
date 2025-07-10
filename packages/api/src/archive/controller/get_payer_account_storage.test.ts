import request from "supertest";
import { logger } from "@stela/logger";
import { app } from "../../app";
import { db } from "../../database";
import { GB } from "../../constants";
import { mockVerifyUserAuthentication } from "../../../test/middleware_mocks";

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
		mockVerifyUserAuthentication(
			"test+1@permanent.org",
			"82bd483e-914b-4bfe-abf9-92ffe86d7803",
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
		expect(response.body).toEqual({
			accountId: "2",
			accountSpaceId: expect.any(String) as unknown,
			spaceLeft: (2 * GB).toString(),
			spaceTotal: (2 * GB).toString(),
			filesLeft: "100000",
			filesTotal: "100000",
			status: "status.generic.ok",
			type: "type.generic.placeholder",
			createdDt: expect.any(String) as unknown,
			updatedDt: expect.any(String) as unknown,
		});
	});

	test("should throw a not found error if account can't access the archive", async () => {
		mockVerifyUserAuthentication(
			"test+2@permanent.org",
			"82bd483e-914b-4bfe-abf9-92ffe86d7803",
		);
		await agent.get("/api/v2/archive/1/payer-account-storage").expect(404);
	});

	test("should throw a not found error if archive has no payer account", async () => {
		await agent.get("/api/v2/archive/3/payer-account-storage").expect(404);
	});

	test("should throw a bad request error if the request is invalid", async () => {
		mockVerifyUserAuthentication("test+1@permanent.org");
		await agent.get("/api/v2/archive/1/payer-account-storage").expect(400);
	});

	test("should throw an internal server error if database call fails", async () => {
		const testError = new Error("out of cheese - redo from start");
		jest.spyOn(db, "sql").mockRejectedValueOnce(testError);
		await agent.get("/api/v2/archive/2/payer-account-storage").expect(500);
		expect(logger.error).toHaveBeenCalledWith(testError);
	});
});
