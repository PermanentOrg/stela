import type { Response, NextFunction } from "express";
import createError from "http-errors";
import request from "supertest";
import { app } from "../app";
import { db } from "../database";
import { verifyUserAuthentication } from "../middleware";

jest.mock("../database");
jest.mock("../middleware");

const setupDatabase = async (): Promise<void> => {
  await db.sql("fixtures.create_test_accounts");
  await db.sql("fixtures.create_test_archive");
  await db.sql("fixtures.create_test_account_archive");
  await db.sql("fixtures.create_test_records");
};

const clearDatabase = async (): Promise<void> => {
  await db.query("TRUNCATE account, archive, record CASCADE");
};

fdescribe("record/get", () => {
  beforeEach(async () => {
    (verifyUserAuthentication as jest.Mock).mockImplementation(
      (req, _: Response, next: NextFunction) => {
        req.body.emailFromAuthToken = "test@permanent.org";
        next();
      }
    );
    await clearDatabase();
    await setupDatabase();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  const agent = request(app);
  test("expect a 200 response", async () => {
    (verifyUserAuthentication as jest.Mock).mockImplementation(
      (_, __, next: NextFunction) => {
        next(new createError.Unauthorized("You aren't logged in"));
      }
    );
    await agent.get("/api/v2/record/get?recordIds[]=1").expect(200);
  });
  test("expect request to have an email from auth token", async () => {
    (verifyUserAuthentication as jest.Mock).mockImplementation(
      (_, __, next: NextFunction) => {
        next();
      }
    );
    await agent.get("/api/v2/record/get").expect(400);
  });
  test("expect an empty query to cause a 400 error", async () => {
    await agent.get("/api/v2/record/get").expect(400);
  });
  test("expect a non-array record ID to cause a 400 error", async () => {
    await agent.get("/api/v2/record/get?recordIds=1").expect(400);
  });
  test("expect an empty array to cause a 400 error", async () => {
    await agent.get("/api/v2/record/get?recordIds[]").expect(400);
  });
  test("expect to return a record", async () => {
    const response = await agent
      .get("/api/v2/record/get?recordIds[]=1")
      .expect(200);
    expect(response.body.length).toEqual(1);
    expect(response.body[0].recordId).toEqual("1");
  });
  test("expect to return multiple records", async () => {
    const response = await agent
      .get("/api/v2/record/get?recordIds[]=1&recordIds[]=2")
      .expect(200);
    expect(response.body.length).toEqual(2);
  });
  test("expect a 404 if the logged-in user does not own the record", async () => {
    await agent.get("/api/v2/record/get?recordIds[]=6").expect(404);
  });
  test("expect a 404 if the record is deleted", async () => {
    await agent.get("/api/v2/record/get?recordIds[]=4").expect(404);
  });
  test("expect to return a public record not owned by logged-in user", async () => {
    const response = await agent
      .get("/api/v2/record/get?recordIds[]=5")
      .expect(200);
    expect(response.body.length).toEqual(1);
    expect(response.body[0].recordId).toEqual("5");
  });
});
