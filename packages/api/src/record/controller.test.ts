import type { Response, NextFunction } from "express";
import request from "supertest";
import { app } from "../app";
import { db } from "../database";
import { extractUserEmailFromAuthToken } from "../middleware";
import type { ArchiveFile, Share, Tag } from "./models";

jest.mock("../database");
jest.mock("../middleware");

const setupDatabase = async (): Promise<void> => {
  await db.sql("fixtures.create_test_accounts");
  await db.sql("fixtures.create_test_archive");
  await db.sql("fixtures.create_test_account_archive");
  await db.sql("fixtures.create_test_records");
  await db.sql("fixtures.create_complete_test_record");
  await db.sql("fixtures.create_test_folders");
  await db.sql("fixtures.create_test_folder_links");
  await db.sql("fixtures.create_test_accesses");
  await db.sql("fixtures.create_test_files");
  await db.sql("fixtures.create_complete_test_files");
  await db.sql("fixtures.create_test_record_files");
  await db.sql("fixtures.create_test_tags");
  await db.sql("fixtures.create_test_tag_links");
  await db.sql("fixtures.create_test_shares");
};

const clearDatabase = async (): Promise<void> => {
  await db.query(
    `TRUNCATE 
       account,
       archive,
       account_archive,
       record,
       folder,
       folder_link,
       access,
       tag,
       tag_link,
       share CASCADE`
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
    expect(response.body[0].files.length).toEqual(2);
    const originalFile = response.body[0].files.find(
      (file: ArchiveFile) => file.fileId === "8"
    );
    const convertedFile = response.body[0].files.find(
      (file: ArchiveFile) => file.fileId === "9"
    );
    expect(originalFile).toBeTruthy();
    expect(convertedFile).toBeTruthy();
    expect(originalFile.size).toEqual(1024);
    expect(convertedFile.size).toEqual(2056);
    expect(originalFile.format).toEqual("file.format.original");
    expect(convertedFile.format).toEqual("file.format.converted");
    expect(originalFile.type).toEqual("type.file.image.png");
    expect(convertedFile.type).toEqual("type.file.image.jpg");
    expect(originalFile.fileUrl).toEqual(
      "https://localcdn.permanent.org/_Dev/8?t=1732914102&Expires=1732914102&Signature=AmCIgw__&Key-Pair-Id=APKA"
    );
    expect(originalFile.downloadUrl).toEqual(
      "https://localcdn.permanent.org/_Dev/8?t=1732914102&response-content-disposition=attachment%3B+filename%3D%22Robert+birthday+%281%29.jpg%22&Expires=1732914102&Signature=R25~ODA0uZ77J2rjQ__&Key-Pair-Id=APKA"
    );

    expect(response.body[0].folderLinkId).toEqual("8");
    expect(response.body[0].folderLinkType).toEqual("type.folder_link.public");
    expect(response.body[0].parentFolderId).toEqual("1");
    expect(response.body[0].parentFolderLinkId).toEqual("9");
    expect(response.body[0].parentFolderArchiveNumber).toEqual("0001-test");
    expect(response.body[0].tags.length).toEqual(3);
    const firstTag = response.body[0].tags.find(
      (tag: Tag) => tag.tagId === "14"
    );
    const secondTag = response.body[0].tags.find(
      (tag: Tag) => tag.tagId === "15"
    );
    const thirdTag = response.body[0].tags.find(
      (tag: Tag) => tag.tagId === "16"
    );
    expect(firstTag.name).toEqual("Generic Tag 1");
    expect(secondTag.name).toEqual("Generic Tag 2");
    expect(thirdTag.name).toEqual("Generic Tag 3");
    expect(firstTag.type).toEqual("type.generic.placeholder");
    expect(secondTag.type).toEqual("type.generic.placeholder");
    expect(thirdTag.type).toEqual("type.tag.metadata.CustomField");

    expect(response.body[0].archiveArchiveNumber).toEqual("0001-0001");

    // Things needed in shares objects: shareId, accessRole, status, archive object (name, id, thumbnails)
    expect(response.body[0].shares.length).toEqual(1);
    expect(response.body[0].shares[0].shareId).toEqual("1");
    const share: Share = response.body[0].shares.find(
      (share: Share) => share.shareId === "1"
    );
    expect(share.accessRole).toEqual("access.role.viewer");
    expect(share.archiveId).toEqual("3");
    expect(share.status).toEqual("status.generic.ok");
    expect(share.archive.thumbUrl200).toEqual("https://test-archive-thumbnail");
    expect(share.archive.name).toEqual("Jay Rando");
  });
});
