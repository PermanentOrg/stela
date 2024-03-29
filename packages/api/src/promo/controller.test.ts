import request from "supertest";
import type { Request, NextFunction } from "express";
import createError from "http-errors";
import { logger } from "@stela/logger";
import { app } from "../app";
import { verifyAdminAuthentication } from "../middleware/authentication";
import type { CreatePromoRequest } from "./models";
import { db } from "../database";

jest.mock("../middleware/authentication");
jest.mock("../database");
jest.mock("@stela/logger");

const clearDatabase = async (): Promise<void> => {
  await db.query("TRUNCATE promo CASCADE");
};
describe("POST /promo", () => {
  const agent = request(app);
  beforeEach(async () => {
    (verifyAdminAuthentication as jest.Mock).mockImplementation(
      (req: Request, __, next: NextFunction) => {
        (req.body as CreatePromoRequest).emailFromAuthToken =
          "test@permanent.org";
        next();
      }
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
    (verifyAdminAuthentication as jest.Mock).mockImplementation(
      (_: Request, __, next: NextFunction) => {
        next(new createError.Unauthorized("You aren't logged in"));
      }
    );
    await agent.post("/api/v2/promo").expect(401);
  });

  test("should respond with 400 status code if missing emailFromAuthToken", async () => {
    (verifyAdminAuthentication as jest.Mock).mockImplementation(
      (_: Request, __, next: NextFunction) => {
        next();
      }
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

  test("should respond with 400 status code if emailFromAuthToken is not a string", async () => {
    (verifyAdminAuthentication as jest.Mock).mockImplementation(
      (req: Request, __, next: NextFunction) => {
        (req.body as { emailFromAuthToken: number }).emailFromAuthToken = 123;
        next();
      }
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
    (verifyAdminAuthentication as jest.Mock).mockImplementation(
      (req: Request, __, next: NextFunction) => {
        (req.body as CreatePromoRequest).emailFromAuthToken = "not_an_email";
        next();
      }
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
        code = 'TEST'`
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
