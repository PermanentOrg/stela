import request from "supertest";
import type { Request, NextFunction } from "express";
import createError from "http-errors";
import { logger } from "@stela/logger";
import { app } from "../../app";
import { verifyUserAuthentication } from "../../middleware";
import { db } from "../../database";
import type { Folder } from "../../folder/models";

jest.mock("../../database");
jest.mock("../../middleware");
jest.mock("@stela/logger");

const loadFixtures = async (): Promise<void> => {
  await db.sql("archive.fixtures.create_test_accounts");
  await db.sql("archive.fixtures.create_test_archives");
  await db.sql("archive.fixtures.create_test_account_archives");
  await db.sql("archive.fixtures.create_test_folders");
  await db.sql("archive.fixtures.create_test_folder_links");
  await db.sql("archive.fixtures.create_test_shares");
};

const clearDatabase = async (): Promise<void> => {
  await db.query(
    "TRUNCATE account, archive, account_archive, folder, folder_link, share CASCADE"
  );
};

describe("getSharedFolders", () => {
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
          "553f3cb8-b753-43ce-83af-4443a404741b";
        next();
      }
    );
    await loadFixtures();
  });

  afterEach(async () => {
    await clearDatabase();
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  test("should return shared folders for an archive", async () => {
    const response = await agent
      .get(`/api/v2/archive/2/folders/shared`)
      .expect(200);

    const folders = (response.body as { items: Folder[] }).items;
    expect(folders.length).toBe(1);
    expect(folders[0]?.folderId).toBe("3");
  });

  test("should return 401 when not authenticated", async () => {
    (verifyUserAuthentication as jest.Mock).mockImplementation(
      (_: Request, __: Response, next: NextFunction) => {
        next(new createError.Unauthorized("Invalid token"));
      }
    );

    await agent.get(`/api/v2/archive/2/folders/shared`).expect(401);
  });

  test("should return 400 if the header data is missing", async () => {
    (verifyUserAuthentication as jest.Mock).mockImplementation(
      (_: Request, __: Response, next: NextFunction) => {
        next();
      }
    );
    await agent.get(`/api/v2/archive/2/folders/shared`).expect(400);
  });

  test("should return 500 if database query fails", async () => {
    const testError = new Error("error: database connection lost");
    jest.spyOn(db, "sql").mockRejectedValueOnce(testError);
    await agent.get(`/api/v2/archive/2/folders/shared`).expect(500);
    expect(logger.error).toHaveBeenCalledWith(testError);
  });

  test("should not return shared folders for an archive if the user is not a member", async () => {
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
        req.body.emailFromAuthToken = "test@permanent.org";
        req.body.userSubjectFromAuthToken =
          "553f3cb8-b753-43ce-83af-4443a404741b";
        next();
      }
    );
    const response = await agent
      .get(`/api/v2/archive/2/folders/shared`)
      .expect(200);

    const folders = (response.body as { items: Folder[] }).items;
    expect(folders.length).toBe(0);
  });

  test("should not return folders where the share has been deleted", async () => {
    const response = await agent
      .get(`/api/v2/archive/1/folders/shared`)
      .expect(200);

    const folders = (response.body as { items: Folder[] }).items;
    expect(folders.length).toBe(0);
  });

  test("should not return folders where archive membership has been deleted", async () => {
    const response = await agent
      .get(`/api/v2/archive/3/folders/shared`)
      .expect(200);

    const folders = (response.body as { items: Folder[] }).items;
    expect(folders.length).toBe(0);
  });
});
