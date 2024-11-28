import type { Request, NextFunction } from "express";
import { logger } from "@stela/logger";
import request from "supertest";
import { app } from "../app";
import { db } from "../database";
import {
  extractUserEmailFromAuthToken,
  verifyUserAuthentication,
} from "../middleware";

jest.mock("../database");
jest.mock("../middleware");
jest.mock("@stela/logger");

const setupDatabase = async (): Promise<void> => {
  await db.sql("fixtures.create_test_folders");
};

const clearDatabase = async (): Promise<void> => {
  await db.query(
    `TRUNCATE 
       folder CASCADE`
  );
};

describe("patch folder", () => {
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
        next: NextFunction
      ) => {
        req.body.emailFromAuthToken = "test+1@permanent.org";
        req.body.userSubjectFromAuthToken =
          "b5461dc2-1eb0-450e-b710-fef7b2cafe1e";

        next();
      }
    );
    await clearDatabase();
    await setupDatabase();
  });

  afterEach(async () => {
    await clearDatabase();
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  test("expect an empty query to cause a 400 error", async () => {
    await agent.patch("/api/v2/folder/1").send({}).expect(400);
  });

  test("expect non existent folder to cause a 404 error", async () => {
    await agent
      .patch("/api/v2/folder/111111111")
      .send({ displayDate: "2024-09-26T15:09:52.000Z" })
      .expect(404);
  });

  test("expect request to have an email from auth token if an auth token exists", async () => {
    (extractUserEmailFromAuthToken as jest.Mock).mockImplementation(
      (req: Request, __, next: NextFunction) => {
        (req.body as { emailFromAuthToken: string }).emailFromAuthToken =
          "not an email";
        next();
      }
    );

    await agent.patch("/api/v2/folder/1").expect(400);
  });

  test("expect displayDate is updated", async () => {
    await agent
      .patch("/api/v2/folder/1")
      .send({ displayDate: "2024-09-26T15:09:52" })
      .expect(200);

    const result = await db.query(
      "SELECT to_char(displaydt, 'YYYY-MM-DD HH24:MI:SS') as displaydt FROM folder WHERE folderid = :folderId",
      {
        folderId: 1,
      }
    );

    expect(result.rows[0]).toEqual({ displaydt: "2024-09-26 15:09:52" });
  });

  test("expect displayDate is updated when set to null", async () => {
    await agent
      .patch("/api/v2/folder/1")
      .send({ displayDate: null })
      .expect(200);

    const result = await db.query(
      "SELECT displaydt FROM folder WHERE folderid = :folderId",
      {
        folderId: 1,
      }
    );

    expect(result.rows[0]).toStrictEqual({ displaydt: null });
  });

  test("expect 400 error if display date is wrong type", async () => {
    await agent
      .patch("/api/v2/folder/1")
      .send({
        displayDate: false,
      })
      .expect(400);
  });

  test("expect to log error and return 500 if database update fails", async () => {
    const testError = new Error("test error");
    const spy = jest.spyOn(db, "query").mockImplementation(async () => {
      throw testError;
    });

    await agent
      .patch("/api/v2/folder/1")
      .send({ displayDate: "2024-09-26T15:09:52.000Z" })
      .expect(500);
    spy.mockRestore();

    expect(logger.error).toHaveBeenCalledWith(testError);
  });

  test("expect to log error and return 500 if database update is ok but the database select fails", async () => {
    const testError = new Error("test error");
    jest.spyOn(db, "sql").mockImplementationOnce(async () => {
      throw testError;
    });

    await agent
      .patch("/api/v2/folder/1")
      .send({ displayDate: "2024-09-26T15:09:52.000Z" })
      .expect(500);

    const result = await db.query(
      "SELECT to_char(displaydt, 'YYYY-MM-DD HH24:MI:SS') as displaydt FROM folder WHERE folderid = :folderId",
      {
        folderId: 1,
      }
    );

    expect(result.rows[0]).toEqual({ displaydt: "2024-09-26 15:09:52" });

    expect(logger.error).toHaveBeenCalledWith(testError);
  });

  test("expect to log error and return 404 if database update is ok but the database select has empty result", async () => {
    jest.spyOn(db, "sql").mockImplementationOnce(
      (async () =>
        ({
          rows: [],
        } as object)) as unknown as typeof db.sql
    );

    await agent
      .patch("/api/v2/folder/1")
      .send({ displayDate: "2024-09-26T15:09:52.000Z" })
      .expect(404);
  });
});
