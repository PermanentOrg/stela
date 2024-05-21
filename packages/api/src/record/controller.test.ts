import type { Response, NextFunction } from "express";
import request from "supertest";
import { app } from "../app";
import { db } from "../database";
import { extractUserEmailFromAuthToken } from "../middleware";

jest.mock("../database");
jest.mock("../middleware");

const setupDatabase = async (): Promise<void> => {
  await db.sql("fixtures.create_test_accounts");
  await db.sql("fixtures.create_test_archive");
  await db.sql("fixtures.create_test_account_archive");
  await db.sql("fixtures.create_test_records");
  await db.sql("fixtures.create_complete_test_record");
  await db.sql("fixtures.create_test_folder_links");
  await db.sql("fixtures.create_test_accesses");
};

const clearDatabase = async (): Promise<void> => {
  await db.query(
    "TRUNCATE account, archive, account_archive, record, folder_link, access CASCADE"
  );
};

fdescribe("record/get", () => {
  beforeEach(async () => {
    (extractUserEmailFromAuthToken as jest.Mock).mockImplementation(
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
  test("expect request to have an email from auth token if an auth token exists", async () => {
    (extractUserEmailFromAuthToken as jest.Mock).mockImplementation(
      (req, __, next: NextFunction) => {
        req.body.emailFromAuthToken = "not an email";
        next();
      }
    );
    await agent.get("/api/v2/record/get?recordIds[]=1").expect(400);
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
  test("expect return a public record when not logged in", async () => {
    (extractUserEmailFromAuthToken as jest.Mock).mockImplementation(
      (_, __, next: NextFunction) => {
        next();
      }
    );
    const response = await agent
      .get("/api/v2/record/get?recordIds[]=1")
      .expect(200);
    expect(response.body.length).toEqual(1);
    expect(response.body[0].recordId).toEqual("1");
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
  test("expect an empty response if the logged-in user does not own the record", async () => {
    const response = await agent
      .get("/api/v2/record/get?recordIds[]=7")
      .expect(200);
    expect(response.body.length).toEqual(0);
  });
  test("expect an empty response if the record is deleted", async () => {
    const response = await agent
      .get("/api/v2/record/get?recordIds[]=4")
      .expect(200);
    expect(response.body.length).toEqual(0);
  });
  test("expect to return a public record not owned by logged-in user", async () => {
    const response = await agent
      .get("/api/v2/record/get?recordIds[]=5")
      .expect(200);
    expect(response.body.length).toEqual(1);
    expect(response.body[0].recordId).toEqual("5");
  });
  test("expect return a public record when not logged in", async () => {
    (extractUserEmailFromAuthToken as jest.Mock).mockImplementation(
      (_, __, next: NextFunction) => {
        next();
      }
    );
    const response = await agent
      .get("/api/v2/record/get?recordIds[]=1")
      .expect(200);
    expect(response.body.length).toEqual(1);
    expect(response.body[0].recordId).toEqual("1");
  });
  test("expect not to return a private record when not logged in", async () => {
    (extractUserEmailFromAuthToken as jest.Mock).mockImplementation(
      (_, __, next: NextFunction) => {
        next();
      }
    );
    const response = await agent
      .get("/api/v2/record/get?recordIds[]=2")
      .expect(200);
    expect(response.body.length).toEqual(0);
  });
  test("expect to return a private record shared with the logged in account", async () => {
    // Note: Records shared directly or that are descended from a shared folder
    // will all have equivalent entries in the access table. So we don't need to
    // test that separately.
    const response = await agent
      .get("/api/v2/record/get?recordIds[]=6")
      .expect(200);
    expect(response.body.length).toEqual(1);
    expect(response.body[0].recordId).toEqual("6");
  });
  test("expect to receive a whole record", async () => {
    // record, child files, folder links (necessary?), parent folder,
    // object (necessary?), original exif data (seems unnecessary?),
    // fileDurationInSeconds (not used in UI), tags as objects, timezone as an
    // object (unnecessary), archive.archiveNbr, shares
    const response = await agent
      .get("/api/v2/record/get?recordIds[]=8")
      .expect(200);
    expect(response.body.length).toEqual(1);
    expect(response.body[0].recordId).toEqual("8");
    expect(response.body[0].displayName).toEqual("Public File");
    expect(response.body[0].archiveId).toEqual("1");
    expect(response.body[0].archiveNumber).toEqual("0000-0008");
    expect(response.body[0].publicAt).toEqual("2023-06-21T00:00:00.000Z");
    expect(response.body[0].description).toEqual("A description of the image");
    expect(response.body[0].downloadName).toEqual("public_file.jpg");
    expect(response.body[0].uploadFileName).toEqual("public_file.jpg");
    expect(response.body[0].uploadAccountId).toEqual("2");
    expect(response.body[0].uploadPayerAccountId).toEqual("2");
    expect(response.body[0].size).toEqual(1024);
    expect(response.body[0].displayDate).toEqual("2023-06-21T00:00:00.000Z");
    expect(response.body[0].fileCreatedAt).toEqual("2023-06-21T00:00:00.000Z");
    expect(response.body[0].imageRatio).toEqual(1);
    expect(response.body[0].thumbUrl200).toEqual(
      "https://localcdn.permanent.org/8/thumb200.jpg"
    );
    expect(response.body[0].thumbUrl500).toEqual(
      "https://localcdn.permanent.org/8/thumb500.jpg"
    );
    expect(response.body[0].thumbUrl1000).toEqual(
      "https://localcdn.permanent.org/8/thumb1000.jpg"
    );
    expect(response.body[0].thumbUrl2000).toEqual(
      "https://localcdn.permanent.org/8/thumb2000.jpg"
    );
    expect(response.body[0].status).toEqual("status.generic.ok");
    expect(response.body[0].type).toEqual("type.record.image");
    expect(response.body[0].createdAt).toEqual("2023-06-21T00:00:00.000Z");
    expect(response.body[0].updatedAt).toEqual("2023-06-21T00:00:00.000Z");
    expect(response.body[0].altText).toEqual("An image");
  });
});
