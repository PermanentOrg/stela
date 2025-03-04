import type { NextFunction, Request } from "express";
import { logger } from "@stela/logger";
import request from "supertest";
import { when } from "jest-when";
import { app } from "../app";
import { db } from "../database";
import {
  extractShareTokenFromHeaders,
  extractUserEmailFromAuthToken,
  verifyUserAuthentication,
} from "../middleware";
import type { Folder } from "./models";

jest.mock("../database");
jest.mock("../middleware");
jest.mock("@stela/logger");

const loadFixtures = async (): Promise<void> => {
  await db.sql("folder.fixtures.create_test_accounts");
  await db.sql("folder.fixtures.create_test_archives");
  await db.sql("folder.fixtures.create_test_account_archives");
  await db.sql("folder.fixtures.create_test_folders");
  await db.sql("folder.fixtures.create_test_folder_links");
  await db.sql("folder.fixtures.create_test_shareby_urls");
  await db.sql("folder.fixtures.create_test_accesses");
  await db.sql("folder.fixtures.create_test_folder_sizes");
  await db.sql("folder.fixtures.create_test_locns");
  await db.sql("folder.fixtures.create_test_shares");
  await db.sql("folder.fixtures.create_test_profile_items");
  await db.sql("folder.fixtures.create_test_tags");
  await db.sql("folder.fixtures.create_test_tag_links");
};

const clearDatabase = async (): Promise<void> => {
  await db.query(
    `TRUNCATE 
      event,
      account_archive,
      account,
      archive,
      folder,
      folder_link,
      shareby_url,
      access,
      folder_size,
      locn,
      share,
      profile_item,
      tag,
      tag_link
    CASCADE`
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
        req.body.emailFromAuthToken = "test@permanent.org";
        req.body.userSubjectFromAuthToken =
          "b5461dc2-1eb0-450e-b710-fef7b2cafe1e";
        next();
      }
    );
    await clearDatabase();
    await loadFixtures();
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
    (verifyUserAuthentication as jest.Mock).mockImplementation(
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
    const sqlSpy = jest.spyOn(db, "sql");
    when(sqlSpy)
      .calledWith("folder.queries.get_folders", {
        folderIds: ["1"],
        email: "test@permanent.org",
        shareToken: undefined,
      })
      .mockImplementation(async () => {
        throw testError;
      });

    await agent
      .patch("/api/v2/folder/1")
      .send({ displayDate: "2024-09-26T15:09:52.000Z" })
      .expect(500);

    expect(logger.error).toHaveBeenCalledWith(testError);
  });

  test("expect to log error and return 404 if database update is ok but the database select has empty result", async () => {
    const sqlSpy = jest.spyOn(db, "sql");
    when(sqlSpy)
      .calledWith("folder.queries.get_folders", {
        folderIds: ["1"],
        email: "test@permanent.org",
        shareToken: undefined,
      })
      .mockImplementationOnce(
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

  test("expect 403 forbidden response if user doesn't have edit access rights", async () => {
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

    await agent
      .patch("/api/v2/folder/1")
      .send({ displayDate: "2024-09-26T15:09:52" })
      .expect(403);
  });

  test("expect 404 not found response if user doesn't have access rights", async () => {
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
        req.body.emailFromAuthToken = "unknown@permanent.org";
        req.body.userSubjectFromAuthToken =
          "b5461dc2-1eb0-450e-b710-fef7b2cafe1e";
        next();
      }
    );

    await agent
      .patch("/api/v2/folder/1")
      .send({ displayDate: "2024-09-26T15:09:52" })
      .expect(404);
  });
});

describe("GET /folder/{id}", () => {
  const agent = request(app);

  beforeEach(async () => {
    (extractUserEmailFromAuthToken as jest.Mock).mockImplementation(
      async (
        req: Request<unknown, unknown, { emailFromAuthToken?: string }>,
        __,
        next: NextFunction
      ) => {
        req.body.emailFromAuthToken = "test@permanent.org";
        next();
      }
    );
    (extractShareTokenFromHeaders as jest.Mock).mockImplementation(
      async (
        ___: Request<
          unknown,
          unknown,
          { emailFromAuthToken?: string; shareToken?: string }
        >,
        __,
        next: NextFunction
      ) => {
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

  test("should return 200 code for successful call", async () => {
    await agent.get("/api/v2/folder?folderIds[]=1").expect(200);
  });

  test("should call extractUserEmailFromAuthToken middleware", async () => {
    await agent.get("/api/v2/folder?folderIds[]=1").expect(200);
    expect(extractUserEmailFromAuthToken).toHaveBeenCalled();
  });

  test("should call extractShareTokenFromHeaders middleware", async () => {
    await agent.get("/api/v2/folder?folderIds[]=1").expect(200);
    expect(extractShareTokenFromHeaders).toHaveBeenCalled();
  });

  test("should return 400 code if the header values are improper", async () => {
    (extractUserEmailFromAuthToken as jest.Mock).mockImplementation(
      async (
        req: Request<unknown, unknown, { emailFromAuthToken?: string }>,
        __,
        next: NextFunction
      ) => {
        req.body.emailFromAuthToken = "not_an_email";
        next();
      }
    );
    await agent.get("/api/v2/folder?folderIds[]=1").expect(400);
  });

  test("should return a public folder if the user is not authenticated", async () => {
    (extractUserEmailFromAuthToken as jest.Mock).mockImplementation(
      async (
        _: Request<unknown, unknown, { emailFromAuthToken?: string }>,
        __,
        next: NextFunction
      ) => {
        next();
      }
    );
    const response = await agent
      .get("/api/v2/folder?folderIds[]=1")
      .expect(200);
    const folders = (response.body as { items: Folder[] }).items;
    expect(folders.length).toEqual(1);
    expect(folders[0]?.folderId).toEqual("1");
  });

  test("should not return a private folder if the user is not authenticated", async () => {
    (extractUserEmailFromAuthToken as jest.Mock).mockImplementation(
      async (
        _: Request<unknown, unknown, { emailFromAuthToken?: string }>,
        __,
        next: NextFunction
      ) => {
        next();
      }
    );
    const response = await agent
      .get("/api/v2/folder?folderIds[]=2")
      .expect(200);
    const folders = (response.body as { items: Folder[] }).items;
    expect(folders.length).toEqual(0);
  });

  test("should return a private folder if the user is authenticated", async () => {
    const response = await agent
      .get("/api/v2/folder?folderIds[]=2")
      .expect(200);
    const folders = (response.body as { items: Folder[] }).items;
    expect(folders.length).toEqual(1);
    expect(folders[0]?.folderId).toEqual("2");
  });

  test("should not return a private folder if the caller is no longer a member of its archive", async () => {
    (extractUserEmailFromAuthToken as jest.Mock).mockImplementation(
      async (
        req: Request<unknown, unknown, { emailFromAuthToken?: string }>,
        __,
        next: NextFunction
      ) => {
        req.body.emailFromAuthToken = "test+3@permanent.org";
        next();
      }
    );

    const response = await agent
      .get("/api/v2/folder?folderIds[]=2")
      .expect(200);
    const folders = (response.body as { items: Folder[] }).items;
    expect(folders.length).toEqual(0);
  });

  test("should return a private folder if the user has a share token", async () => {
    (extractUserEmailFromAuthToken as jest.Mock).mockImplementation(
      async (
        _: Request<unknown, unknown, { emailFromAuthToken?: string }>,
        __,
        next: NextFunction
      ) => {
        next();
      }
    );
    (extractShareTokenFromHeaders as jest.Mock).mockImplementation(
      async (
        req: Request<
          unknown,
          unknown,
          { emailFromAuthToken?: string; shareToken?: string }
        >,
        __,
        next: NextFunction
      ) => {
        req.body.shareToken = "c0f523e4-48d8-4c39-8cda-5e95161532e4";
        next();
      }
    );
    const response = await agent
      .get("/api/v2/folder?folderIds[]=2")
      .set("X-Permanent-Share-Token", "c0f523e4-48d8-4c39-8cda-5e95161532e4")
      .expect(200);
    const folders = (response.body as { items: Folder[] }).items;
    expect(folders.length).toEqual(1);
    expect(folders[0]?.folderId).toEqual("2");
  });

  test("should return a private folder if the user has a share token for the parent folder", async () => {
    (extractUserEmailFromAuthToken as jest.Mock).mockImplementation(
      async (
        _: Request<unknown, unknown, { emailFromAuthToken?: string }>,
        __,
        next: NextFunction
      ) => {
        next();
      }
    );
    (extractShareTokenFromHeaders as jest.Mock).mockImplementation(
      async (
        req: Request<
          unknown,
          unknown,
          { emailFromAuthToken?: string; shareToken?: string }
        >,
        __,
        next: NextFunction
      ) => {
        req.body.shareToken = "56f7c246-e4ec-41f3-b117-6df4c9377075";
        next();
      }
    );
    const response = await agent
      .get("/api/v2/folder?folderIds[]=2")
      .set("X-Permanent-Share-Token", "56f7c246-e4ec-41f3-b117-6df4c9377075")
      .expect(200);
    const folders = (response.body as { items: Folder[] }).items;
    expect(folders.length).toEqual(1);
    expect(folders[0]?.folderId).toEqual("2");
  });

  test("should not return a private folder if the share token is not unlisted", async () => {
    (extractUserEmailFromAuthToken as jest.Mock).mockImplementation(
      async (
        _: Request<unknown, unknown, { emailFromAuthToken?: string }>,
        __,
        next: NextFunction
      ) => {
        next();
      }
    );
    (extractShareTokenFromHeaders as jest.Mock).mockImplementation(
      async (
        req: Request<
          unknown,
          unknown,
          { emailFromAuthToken?: string; shareToken?: string }
        >,
        __,
        next: NextFunction
      ) => {
        req.body.shareToken = "7d6412af-5abe-4acb-808a-64e9ce3b7535";
        next();
      }
    );
    const response = await agent
      .get("/api/v2/folder?folderIds[]=2")
      .set("X-Permanent-Share-Token", "7d6412af-5abe-4acb-808a-64e9ce3b7535")
      .expect(200);
    const folders = (response.body as { items: Folder[] }).items;
    expect(folders.length).toEqual(0);
  });

  test("should not return a private folder if the share token is expired", async () => {
    (extractUserEmailFromAuthToken as jest.Mock).mockImplementation(
      async (
        _: Request<unknown, unknown, { emailFromAuthToken?: string }>,
        __,
        next: NextFunction
      ) => {
        next();
      }
    );
    (extractShareTokenFromHeaders as jest.Mock).mockImplementation(
      async (
        req: Request<
          unknown,
          unknown,
          { emailFromAuthToken?: string; shareToken?: string }
        >,
        __,
        next: NextFunction
      ) => {
        req.body.shareToken = "9cc057f0-d3e8-41df-94d6-9b315b4921af";
        next();
      }
    );
    const response = await agent
      .get("/api/v2/folder?folderIds[]=2")
      .set("X-Permanent-Share-Token", "9cc057f0-d3e8-41df-94d6-9b315b4921af")
      .expect(200);
    const folders = (response.body as { items: Folder[] }).items;
    expect(folders.length).toEqual(0);
  });

  test("should return a private folder if the folder is shared with the caller", async () => {
    (extractUserEmailFromAuthToken as jest.Mock).mockImplementation(
      async (
        req: Request<unknown, unknown, { emailFromAuthToken?: string }>,
        __,
        next: NextFunction
      ) => {
        req.body.emailFromAuthToken = "test+2@permanent.org";
        next();
      }
    );
    const response = await agent
      .get("/api/v2/folder?folderIds[]=2")
      .expect(200);
    const folders = (response.body as { items: Folder[] }).items;
    expect(folders.length).toEqual(1);
    expect(folders[0]?.folderId).toEqual("2");
  });

  test("should not return a private folder if caller access relies on a deleted share", async () => {
    (extractUserEmailFromAuthToken as jest.Mock).mockImplementation(
      async (
        req: Request<unknown, unknown, { emailFromAuthToken?: string }>,
        __,
        next: NextFunction
      ) => {
        req.body.emailFromAuthToken = "test+3@permanent.org";
        next();
      }
    );
    const response = await agent
      .get("/api/v2/folder?folderIds[]=2")
      .expect(200);
    const folders = (response.body as { items: Folder[] }).items;
    expect(folders.length).toEqual(0);
  });

  test("should not return a private folder if caller access relies on a share to an archive caller can no longer access", async () => {
    (extractUserEmailFromAuthToken as jest.Mock).mockImplementation(
      async (
        req: Request<unknown, unknown, { emailFromAuthToken?: string }>,
        __,
        next: NextFunction
      ) => {
        req.body.emailFromAuthToken = "test+4@permanent.org";
        next();
      }
    );
    const response = await agent
      .get("/api/v2/folder?folderIds[]=2")
      .expect(200);
    const folders = (response.body as { items: Folder[] }).items;
    expect(folders.length).toEqual(0);
  });

  test("should return all folder data", async () => {
    const response = await agent
      .get("/api/v2/folder?folderIds[]=2")
      .expect(200);
    const folders = (response.body as { items: Folder[] }).items;
    expect(folders.length).toEqual(1);
    expect(folders[0]?.folderId).toEqual("2");
    expect(folders[0]?.size).toEqual(0);
    expect(folders[0]?.location?.id).toEqual("1");
    expect(folders[0]?.location?.streetNumber).toEqual("55");
    expect(folders[0]?.location?.streetName).toEqual("Rue Plumet");
    expect(folders[0]?.location?.locality).toEqual("Paris");
    expect(folders[0]?.location?.county).toEqual("Ile-de-France");
    expect(folders[0]?.location?.state).toBeNull();
    expect(folders[0]?.location?.latitude).toEqual(48.838608548520966);
    expect(folders[0]?.location?.longitude).toEqual(2.3069214988665303);
    expect(folders[0]?.location?.country).toEqual("France");
    expect(folders[0]?.location?.countryCode).toEqual("FR");
    expect(folders[0]?.location?.displayName).toEqual("Jean Valjean's House");
    expect(folders[0]?.parentFolder?.id).toEqual("5");
    expect(folders[0]?.shares?.length).toEqual(1);
    if (folders[0]?.shares?.length === 1) {
      expect(folders[0]?.shares[0]?.id).toEqual("1");
      expect(folders[0]?.shares[0]?.accessRole).toEqual("access.role.curator");
      expect(folders[0]?.shares[0]?.status).toEqual("status.generic.ok");
      expect(folders[0]?.shares[0]?.archive.id).toEqual("2");
      expect(folders[0]?.shares[0]?.archive.thumbUrl200).toEqual(
        "https://test-archive-thumbnail"
      );
      expect(folders[0]?.shares[0]?.archive.name).toEqual("Test Archive");
    }
    expect(folders[0]?.tags?.length).toEqual(1);
    if (folders[0]?.tags?.length === 1) {
      expect(folders[0]?.tags[0]?.id).toEqual("1");
      expect(folders[0]?.tags[0]?.name).toEqual("Test Tag One");
      expect(folders[0]?.tags[0]?.type).toEqual("type.generic.placeholder");
    }
    expect(folders[0]?.archive.id).toEqual("1");
    expect(folders[0]?.createdAt).toEqual("2025-01-01T00:00:00.000Z");
    expect(folders[0]?.updatedAt).toEqual("2025-01-01T00:00:00.000Z");
    expect(folders[0]?.description).toEqual("A test folder");
    expect(folders[0]?.displayTimestamp).toEqual("2025-01-01T00:00:00.000Z");
    expect(folders[0]?.displayEndTimestamp).toEqual("2025-01-01T00:00:00.000Z");
    expect(folders[0]?.displayName).toEqual("Private Folder");
    expect(folders[0]?.downloadName).toEqual("Private Folder");
    expect(folders[0]?.imageRatio).toEqual(1);
    expect(folders[0]?.paths.names.length).toEqual(2);
    expect(folders[0]?.paths.names[0]).toEqual("My Files");
    expect(folders[0]?.paths.names[1]).toEqual("Private Folder");
    expect(folders[0]?.publicAt).toBeNull();
    expect(folders[0]?.sort).toEqual("alphabetical-ascending");
    expect(folders[0]?.thumbnailUrls).toBeDefined();
    if (folders[0]?.thumbnailUrls !== undefined) {
      expect(folders[0]?.thumbnailUrls["200"]).toEqual(
        "https://test-folder-thumbnail-200"
      );
      expect(folders[0].thumbnailUrls["256"]).toEqual(
        "https://test-folder-thumbnail-256"
      );
      expect(folders[0].thumbnailUrls["500"]).toEqual(
        "https://test-folder-thumbnail-500"
      );
      expect(folders[0].thumbnailUrls["1000"]).toEqual(
        "https://test-folder-thumbnail-1000"
      );
      expect(folders[0].thumbnailUrls["2000"]).toEqual(
        "https://test-folder-thumbnail-2000"
      );
    }
    expect(folders[0]?.type).toEqual("private");
    expect(folders[0]?.status).toEqual("ok");
    expect(folders[0]?.view).toEqual("grid");
  });

  test("should retrieve multiple folders if requested", async () => {
    const response = await agent
      .get("/api/v2/folder?folderIds[]=2&folderIds[]=1")
      .expect(200);
    const folders = (response.body as { items: Folder[] }).items;
    expect(folders.length).toEqual(2);
  });

  test("should not retrieve a deleted folder", async () => {
    const response = await agent
      .get("/api/v2/folder?folderIds[]=4")
      .expect(200);
    const folders = (response.body as { items: Folder[] }).items;
    expect(folders.length).toEqual(0);
  });

  test("should not retrieve a folder with a deleted folder_link", async () => {
    const response = await agent
      .get("/api/v2/folder?folderIds[]=3")
      .expect(200);
    const folders = (response.body as { items: Folder[] }).items;
    expect(folders.length).toEqual(0);
  });

  test("should omit size from a folder with a deleted folder_size", async () => {
    const response = await agent
      .get("/api/v2/folder?folderIds[]=7")
      .expect(200);
    const folders = (response.body as { items: Folder[] }).items;
    expect(folders.length).toEqual(1);
    expect(folders[0]?.size).toBeNull();
  });

  test("should throw a 500 error if database call fails", async () => {
    jest.spyOn(db, "sql").mockRejectedValue(new Error("test error"));
    await agent.get("/api/v2/folder?folderIds[]=2").expect(500);
  });
});
