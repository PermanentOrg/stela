import request from "supertest";
import type { NextFunction } from "express";
import createError from "http-errors";
import { logger } from "@stela/logger";
import { app } from "../app";
import { verifyAdminAuthentication } from "../middleware/authentication";
import type { Promo } from "./models";
import { db } from "../database";
import { mockVerifyAdminAuthentication } from "../../test/middleware_mocks";

jest.mock("../middleware/authentication");
jest.mock("../database");
jest.mock("@stela/logger");

const loadFixtures = async (): Promise<void> => {
	await db.sql("promo.fixtures.create_test_promos");
};

const clearDatabase = async (): Promise<void> => {
	await db.query("TRUNCATE promo CASCADE");
};
describe("POST /promo", () => {
	const agent = request(app);
	beforeEach(async () => {
		mockVerifyAdminAuthentication(
			"test@permanent.org",
			"6b640c73-4963-47de-a096-4a05ff8dc5f5",
		);
		jest.restoreAllMocks();
		jest.clearAllMocks();
		await clearDatabase();
	});

	afterEach(async () => {
		jest.restoreAllMocks();
		jest.clearAllMocks();
		await clearDatabase();
	});

	test("should respond with a 200 status code", async () => {
		await agent
			.post("/api/v2/promo")
			.send({
				code: "TEST",
				storageInMB: 1024,
				expirationTimestamp: "3025-01-01",
				totalUses: 100,
			})
			.expect(200);
	});

	test("should respond with 401 status code if lacking admin authentication", async () => {
		jest
			.mocked(verifyAdminAuthentication)
			.mockImplementation(async (_, __, next: NextFunction) => {
				next(new createError.Unauthorized("You aren't logged in"));
			});
		await agent.post("/api/v2/promo").expect(401);
	});

	test("should respond with 400 status code if missing emailFromAuthToken", async () => {
		mockVerifyAdminAuthentication(
			undefined,
			"6b640c73-4963-47de-a096-4a05ff8dc5f5",
		);
		await agent
			.post("/api/v2/promo")
			.send({
				code: "TEST",
				storageInMB: 1024,
				expirationTimestamp: "3025-01-01",
				totalUses: 100,
			})
			.expect(400);
	});

	test("should respond with 400 status code if emailFromAuthToken is not an email", async () => {
		mockVerifyAdminAuthentication(
			"not_an_email",
			"6b640c73-4963-47de-a096-4a05ff8dc5f5",
		);
		await agent
			.post("/api/v2/promo")
			.send({
				code: "TEST",
				storageInMB: 1024,
				expirationTimestamp: "3025-01-01",
				totalUses: 100,
			})
			.expect(400);
	});

	test("should respond with 400 status code if missing adminSubjectFromAuthToken", async () => {
		mockVerifyAdminAuthentication("test@permanent.org");
		await agent
			.post("/api/v2/promo")
			.send({
				code: "TEST",
				storageInMB: 1024,
				expirationTimestamp: "3025-01-01",
				totalUses: 100,
			})
			.expect(400);
	});

	test("should respond with 400 status code if adminSubjectFromAuthToken is not a uuid", async () => {
		mockVerifyAdminAuthentication("test@permanent.org", "not_a_uuid");
		await agent
			.post("/api/v2/promo")
			.send({
				code: "TEST",
				storageInMB: 1024,
				expirationTimestamp: "3025-01-01",
				totalUses: 100,
			})
			.expect(400);
	});

	test("should respond with 400 status code if code is missing", async () => {
		await agent
			.post("/api/v2/promo")
			.send({
				storageInMB: 1024,
				expirationTimestamp: "3025-01-01",
				totalUses: 100,
			})
			.expect(400);
	});

	test("should respond with 400 status code if code is not a string", async () => {
		await agent
			.post("/api/v2/promo")
			.send({
				code: 1,
				storageInMB: 1024,
				expirationTimestamp: "3025-01-01",
				totalUses: 100,
			})
			.expect(400);
	});

	test("should respond with 400 status code if storageInMB is missing", async () => {
		await agent
			.post("/api/v2/promo")
			.send({
				code: "TEST",
				expirationTimestamp: "3025-01-01",
				totalUses: 100,
			})
			.expect(400);
	});

	test("should respond with 400 status code if storageInMB is not a number", async () => {
		await agent
			.post("/api/v2/promo")
			.send({
				code: "TEST",
				storageInMB: "not_a_number",
				expirationTimestamp: "3025-01-01",
				totalUses: 100,
			})
			.expect(400);
	});

	test("should respond with 400 status code if storageInMB is not an integer", async () => {
		await agent
			.post("/api/v2/promo")
			.send({
				code: "TEST",
				storageInMB: 1.5,
				expirationTimestamp: "3025-01-01",
				totalUses: 100,
			})
			.expect(400);
	});

	test("should respond with 400 status code if storageInMB is less than 1", async () => {
		await agent
			.post("/api/v2/promo")
			.send({
				code: "TEST",
				storageInMB: 0,
				expirationTimestamp: "3025-01-01",
				totalUses: 100,
			})
			.expect(400);
	});

	test("should respond with 400 status code if expirationTimestamp is missing", async () => {
		await agent
			.post("/api/v2/promo")
			.send({
				code: "TEST",
				storageInMB: 1024,
				totalUses: 100,
			})
			.expect(400);
	});

	test("should respond with 400 status code if expirationTimestamp is not a date", async () => {
		await agent
			.post("/api/v2/promo")
			.send({
				code: "TEST",
				storageInMB: 1024,
				expirationTimestamp: "not_a_date",
				totalUses: 100,
			})
			.expect(400);
	});

	test("should respond with 400 status code if expirationTimestamp is not in ISO 8601 format", async () => {
		await agent
			.post("/api/v2/promo")
			.send({
				code: "TEST",
				storageInMB: 1024,
				expirationTimestamp: "3/6/2024",
				totalUses: 100,
			})
			.expect(400);
	});

	test("should respond with 400 status code if expirationTimestamp is in the past", async () => {
		await agent
			.post("/api/v2/promo")
			.send({
				code: "TEST",
				storageInMB: 1024,
				expirationTimestamp: "2024-01-01",
				totalUses: 100,
			})
			.expect(400);
	});

	test("should respond with 400 status code if totalUses is missing", async () => {
		await agent
			.post("/api/v2/promo")
			.send({
				code: "TEST",
				storageInMB: 1024,
				expirationTimestamp: "3025-01-01",
			})
			.expect(400);
	});

	test("should respond with 400 status code if totalUses is not a number", async () => {
		await agent
			.post("/api/v2/promo")
			.send({
				code: "TEST",
				storageInMB: 1024,
				expirationTimestamp: "3025-01-01",
				totalUses: "not_a_number",
			})
			.expect(400);
	});

	test("should respond with 400 status code if totalUses is not an integer", async () => {
		await agent
			.post("/api/v2/promo")
			.send({
				code: "TEST",
				storageInMB: 1024,
				expirationTimestamp: "3025-01-01",
				totalUses: 1.5,
			})
			.expect(400);
	});

	test("should respond with 400 status code if totalUses is less than one", async () => {
		await agent
			.post("/api/v2/promo")
			.send({
				code: "TEST",
				storageInMB: 1024,
				expirationTimestamp: "3025-01-01",
				totalUses: 0,
			})
			.expect(400);
	});

	test("should store the new promo code in the database", async () => {
		await agent
			.post("/api/v2/promo")
			.send({
				code: "TEST",
				storageInMB: 1024,
				expirationTimestamp: "3025-01-01",
				totalUses: 150,
			})
			.expect(200);
		const result = await db.query(
			`SELECT
        code,
        sizeInMb::int AS "storageInMB",
        expiresDt AS "expirationTimestamp",
        remainingUses::int AS "totalUses"
      FROM
        promo
      WHERE
        code = 'TEST'`,
		);
		expect(result.rows.length).toBe(1);
		expect(result.rows[0]).toEqual({
			code: "TEST",
			storageInMB: 1024,
			expirationTimestamp: new Date("3025-01-01T00:00:00.000Z"),
			totalUses: 150,
		});
	});

	test("should respond with 500 if the database call fails", async () => {
		jest.spyOn(db, "sql").mockImplementation(() => {
			throw new Error("SQL error");
		});
		await agent
			.post("/api/v2/promo")
			.send({
				code: "TEST",
				storageInMB: 1024,
				expirationTimestamp: "3025-01-01",
				totalUses: 150,
			})
			.expect(500);
	});

	test("should log the error if the database call fails", async () => {
		const testError = new Error("SQL error");
		jest.spyOn(db, "sql").mockRejectedValueOnce(testError);
		await agent
			.post("/api/v2/promo")
			.send({
				code: "TEST",
				storageInMB: 1024,
				expirationTimestamp: "3025-01-01",
				totalUses: 150,
			})
			.expect(500);
		expect(logger.error).toHaveBeenCalled();
	});
});

describe("GET /promo", () => {
	const agent = request(app);

	beforeEach(async () => {
		mockVerifyAdminAuthentication("test@permanent.org");
		jest.restoreAllMocks();
		jest.clearAllMocks();
		await loadFixtures();
	});

	afterEach(async () => {
		jest.restoreAllMocks();
		jest.clearAllMocks();
		await clearDatabase();
	});

	test("should respond with a 200 status code", async () => {
		await agent.get("/api/v2/promo").expect(200);
	});

	test("should respond with 401 status code if lacking admin authentication", async () => {
		jest
			.mocked(verifyAdminAuthentication)
			.mockImplementation(async (_, __, next: NextFunction) => {
				next(new createError.Unauthorized("You aren't logged in"));
			});
		await agent.get("/api/v2/promo").expect(401);
	});

	test("should return all promo codes", async () => {
		const response = await agent.get("/api/v2/promo").expect(200);

		const { body: promos } = response as { body: Promo[] };
		const promoOne = promos.find((promo: Promo) => promo.code === "PROMO1");
		expect(promoOne).not.toBeUndefined();
		if (promoOne !== undefined) {
			expect(promoOne.storageInMB).toEqual(1024);
			expect(promoOne.expirationTimestamp).toEqual("2030-12-31T00:00:00.000Z");
			expect(promoOne.remainingUses).toEqual(100);
			expect(promoOne.status).toEqual("status.promo.valid");
			expect(promoOne.type).toEqual("type.generic.ok");
			expect(promoOne.createdAt).toEqual("2020-01-01T00:00:00.000Z");
			expect(promoOne.updatedAt).toEqual("2020-01-01T00:00:00.000Z");
		}

		const promoTwo = promos.find((promo: Promo) => promo.code === "PROMO2");
		expect(promoTwo).not.toBeUndefined();
		if (promoTwo !== undefined) {
			expect(promoTwo.storageInMB).toEqual(2048);
			expect(promoTwo.expirationTimestamp).toEqual("2031-12-31T00:00:00.000Z");
			expect(promoTwo.remainingUses).toEqual(200);
			expect(promoTwo.status).toEqual("status.promo.valid");
			expect(promoTwo.type).toEqual("type.generic.ok");
			expect(promoTwo.createdAt).toEqual("2020-01-02T00:00:00.000Z");
			expect(promoTwo.updatedAt).toEqual("2020-01-02T00:00:00.000Z");
		}

		const promoThree = promos.find((promo: Promo) => promo.code === "PROMO3");
		expect(promoThree).not.toBeUndefined();
		if (promoThree !== undefined) {
			expect(promoThree.storageInMB).toEqual(4096);
			expect(promoThree.expirationTimestamp).toEqual(
				"2032-12-31T00:00:00.000Z",
			);
			expect(promoThree.remainingUses).toEqual(300);
			expect(promoThree.status).toEqual("status.promo.valid");
			expect(promoThree.type).toEqual("type.generic.ok");
			expect(promoThree.createdAt).toEqual("2020-01-03T00:00:00.000Z");
			expect(promoThree.updatedAt).toEqual("2020-01-03T00:00:00.000Z");
		}
	});

	test("should response with 500 status code if the database call fails", async () => {
		const testError = new Error("SQL error");
		jest.spyOn(db, "sql").mockRejectedValueOnce(testError);

		await agent.get("/api/v2/promo").expect(500);
	});

	test("should log the error if the database call fails", async () => {
		const testError = new Error("SQL error");
		jest.spyOn(db, "sql").mockRejectedValueOnce(testError);

		await agent.get("/api/v2/promo").expect(500);
		expect(logger.error).toHaveBeenCalled();
	});
});
