import type { Request, Response, NextFunction } from "express";
import { logger } from "@stela/logger";
import request from "supertest";
import { app } from "../app";
import { db } from "../database";
import { extractUserEmailFromAuthToken } from "../middleware";
import type { ArchiveFile, ArchiveRecord, Share, Tag } from "./models";

jest.mock("../database");
jest.mock("../middleware");
jest.mock("@stela/logger");

const setupDatabase = async (): Promise<void> => {
  await db.sql("fixtures.create_test_accounts");
  await db.sql("fixtures.create_test_archives");
  await db.sql("fixtures.create_test_account_archives");
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
  await db.sql("fixtures.create_test_profile_items");
  await db.sql("fixtures.create_complete_test_folder_links");
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
       share,
       profile_item CASCADE`
  );
};

describe("record", () => {
  beforeEach(async () => {
    (extractUserEmailFromAuthToken as jest.Mock).mockImplementation(
      (req: Request, _: Response, next: NextFunction) => {
        (req.body as { emailFromAuthToken: string }).emailFromAuthToken =
          "test@permanent.org";
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
      (req: Request, __, next: NextFunction) => {
        (req.body as { emailFromAuthToken: string }).emailFromAuthToken =
          "not an email";
        next();
      }
    );
    await agent.get("/api/v2/record?recordIds[]=1").expect(400);
  });
  test("expect an empty query to cause a 400 error", async () => {
    await agent.get("/api/v2/record").expect(400);
  });
  test("expect a non-array record ID to cause a 400 error", async () => {
    await agent.get("/api/v2/record?recordIds=1").expect(400);
  });
  test("expect an empty array to cause a 400 error", async () => {
    await agent.get("/api/v2/record?recordIds[]").expect(400);
  });
  test("expect return a public record when not logged in", async () => {
    (extractUserEmailFromAuthToken as jest.Mock).mockImplementation(
      (_, __, next: NextFunction) => {
        next();
      }
    );
    const response = await agent
      .get("/api/v2/record?recordIds[]=1")
      .expect(200);
    expect((response.body as ArchiveRecord[]).length).toEqual(1);
    expect((response.body as ArchiveRecord[])[0]?.recordId).toEqual("1");
  });
  test("expect to return a record", async () => {
    const response = await agent
      .get("/api/v2/record?recordIds[]=1")
      .expect(200);
    expect((response.body as ArchiveRecord[]).length).toEqual(1);
    expect((response.body as ArchiveRecord[])[0]?.recordId).toEqual("1");
  });
  test("expect to return multiple records", async () => {
    const response = await agent
      .get("/api/v2/record?recordIds[]=1&recordIds[]=2")
      .expect(200);
    expect((response.body as ArchiveRecord[]).length).toEqual(2);
  });
  test("expect an empty response if the logged-in user does not own the record", async () => {
    const response = await agent
      .get("/api/v2/record?recordIds[]=7")
      .expect(200);
    expect((response.body as ArchiveRecord[]).length).toEqual(0);
  });
  test("expect an empty response if the record is deleted", async () => {
    const response = await agent
      .get("/api/v2/record?recordIds[]=4")
      .expect(200);
    expect((response.body as ArchiveRecord[]).length).toEqual(0);
  });
  test("expect to return a public record not owned by logged-in user", async () => {
    const response = await agent
      .get("/api/v2/record?recordIds[]=5")
      .expect(200);
    expect((response.body as ArchiveRecord[]).length).toEqual(1);
    expect((response.body as ArchiveRecord[])[0]?.recordId).toEqual("5");
  });
  test("expect return a public record when not logged in", async () => {
    (extractUserEmailFromAuthToken as jest.Mock).mockImplementation(
      (_, __, next: NextFunction) => {
        next();
      }
    );
    const response = await agent
      .get("/api/v2/record?recordIds[]=1")
      .expect(200);
    expect((response.body as ArchiveRecord[]).length).toEqual(1);
    expect((response.body as ArchiveRecord[])[0]?.recordId).toEqual("1");
  });
  test("expect not to return a private record when not logged in", async () => {
    (extractUserEmailFromAuthToken as jest.Mock).mockImplementation(
      (_, __, next: NextFunction) => {
        next();
      }
    );
    const response = await agent
      .get("/api/v2/record?recordIds[]=2")
      .expect(200);
    expect((response.body as ArchiveRecord[]).length).toEqual(0);
  });
  test("expect to return a private record shared with the logged in account", async () => {
    // Note: Records shared directly or that are descended from a shared folder
    // will all have equivalent entries in the access table. So we don't need to
    // test that separately.
    const response = await agent
      .get("/api/v2/record?recordIds[]=6")
      .expect(200);
    expect((response.body as ArchiveRecord[]).length).toEqual(1);
    expect((response.body as ArchiveRecord[])[0]?.recordId).toEqual("6");
  });
  test("expect to receive a whole record", async () => {
    const response = await agent
      .get("/api/v2/record?recordIds[]=8")
      .expect(200);
    const record = (response.body as ArchiveRecord[])[0];
    expect((response.body as ArchiveRecord[]).length).toEqual(1);
    expect(record?.recordId).toEqual("8");
    expect(record?.displayName).toEqual("Public File");
    expect(record?.archiveId).toEqual("1");
    expect(record?.archiveNumber).toEqual("0000-0008");
    expect(record?.publicAt).toEqual("2023-06-21T00:00:00.000Z");
    expect(record?.description).toEqual("A description of the image");
    expect(record?.downloadName).toEqual("public_file.jpg");
    expect(record?.uploadFileName).toEqual("public_file.jpg");
    expect(record?.uploadAccountId).toEqual("2");
    expect(record?.uploadPayerAccountId).toEqual("2");
    expect(record?.size).toEqual(1024);
    expect(record?.displayDate).toEqual("2023-06-21T00:00:00.000Z");
    expect(record?.fileCreatedAt).toEqual("2023-06-21T00:00:00.000Z");
    expect(record?.imageRatio).toEqual(1);
    expect(record?.thumbUrl200).toEqual(
      "https://localcdn.permanent.org/8/thumb200.jpg"
    );
    expect(record?.thumbUrl500).toEqual(
      "https://localcdn.permanent.org/8/thumb500.jpg"
    );
    expect(record?.thumbUrl1000).toEqual(
      "https://localcdn.permanent.org/8/thumb1000.jpg"
    );
    expect(record?.thumbUrl2000).toEqual(
      "https://localcdn.permanent.org/8/thumb2000.jpg"
    );
    expect(record?.status).toEqual("status.generic.ok");
    expect(record?.type).toEqual("type.record.image");
    expect(record?.createdAt).toEqual("2023-06-21T00:00:00.000Z");
    expect(record?.updatedAt).toEqual("2023-06-21T00:00:00.000Z");
    expect(record?.altText).toEqual("An image");
    expect(record?.files.length).toEqual(2);
    const originalFile = record?.files.find(
      (file: ArchiveFile) => file.fileId === "8"
    );
    const convertedFile = record?.files.find(
      (file: ArchiveFile) => file.fileId === "9"
    );
    expect(originalFile).toBeTruthy();
    expect(convertedFile).toBeTruthy();
    expect(originalFile?.size).toEqual(1024);
    expect(convertedFile?.size).toEqual(2056);
    expect(originalFile?.format).toEqual("file.format.original");
    expect(convertedFile?.format).toEqual("file.format.converted");
    expect(originalFile?.type).toEqual("type.file.image.png");
    expect(convertedFile?.type).toEqual("type.file.image.jpg");
    expect(originalFile?.fileUrl).toEqual(
      "https://localcdn.permanent.org/_Dev/8?t=1732914102&Expires=1732914102&Signature=AmCIgw__&Key-Pair-Id=APKA"
    );
    expect(originalFile?.downloadUrl).toEqual(
      "https://localcdn.permanent.org/_Dev/8?t=1732914102&response-content-disposition=attachment%3B+filename%3D%22Robert+birthday+%281%29.jpg%22&Expires=1732914102&Signature=R25~ODA0uZ77J2rjQ__&Key-Pair-Id=APKA"
    );

    expect(record?.folderLinkId).toEqual("8");
    expect(record?.folderLinkType).toEqual("type.folder_link.public");
    expect(record?.parentFolderId).toEqual("1");
    expect(record?.parentFolderLinkId).toEqual("9");
    expect(record?.parentFolderArchiveNumber).toEqual("0001-test");
    expect(record?.tags.length).toEqual(3);
    const firstTag = record?.tags.find((tag: Tag) => tag.tagId === "14");
    const secondTag = record?.tags.find((tag: Tag) => tag.tagId === "15");
    const thirdTag = record?.tags.find((tag: Tag) => tag.tagId === "16");
    expect(firstTag?.name).toEqual("Generic Tag 1");
    expect(secondTag?.name).toEqual("Generic Tag 2");
    expect(thirdTag?.name).toEqual("Generic Tag 3");
    expect(firstTag?.type).toEqual("type.generic.placeholder");
    expect(secondTag?.type).toEqual("type.generic.placeholder");
    expect(thirdTag?.type).toEqual("type.tag.metadata.CustomField");

    expect(record?.archiveArchiveNumber).toEqual("0001-0001");

    expect(record?.shares.length).toEqual(2);
    expect(record?.shares[0]?.shareId).toEqual("1");
    const shareViewer = record?.shares.find(
      (share: Share) => share.shareId === "1"
    );
    const shareContributor = record?.shares.find(
      (share: Share) => share.shareId === "2"
    );
    expect(shareViewer?.accessRole).toEqual("access.role.viewer");
    expect(shareViewer?.status).toEqual("status.generic.ok");
    expect(shareViewer?.archive.archiveId).toEqual("3");
    expect(shareViewer?.archive.thumbUrl200).toEqual(
      "https://test-archive-thumbnail"
    );
    expect(shareViewer?.archive.name).toEqual("Jay Rando");

    expect(shareContributor?.accessRole).toEqual("access.role.contributor");
    expect(shareContributor?.status).toEqual("status.generic.ok");
    expect(shareContributor?.archive.archiveId).toEqual("2");
    expect(shareContributor?.archive.thumbUrl200).toBeFalsy();
    expect(shareContributor?.archive.name).toEqual("Jane Rando");
  });
  test("expect to not return deleted files", async () => {
    const response = await agent
      .get("/api/v2/record?recordIds[]=9")
      .expect(200);
    const record = (response.body as ArchiveRecord[])[0];
    expect(record?.files.length).toEqual(1);
  });
  test("expect to not return a record in a deleted archive", async () => {
    const response = await agent
      .get("/api/v2/record?recordIds[]=10")
      .expect(200);
    expect((response.body as ArchiveRecord[]).length).toEqual(0);
  });
  test("expect to not return a record for a pending archive member", async () => {
    const response = await agent
      .get("/api/v2/record?recordIds[]=11")
      .expect(200);
    expect((response.body as ArchiveRecord[]).length).toEqual(0);
  });
  test("expect to not return a record with a deleted folder_link", async () => {
    const response = await agent
      .get("/api/v2/record?recordIds[]=12")
      .expect(200);
    expect((response.body as ArchiveRecord[]).length).toEqual(0);
  });
  test("expect to not return a record with deleted access", async () => {
    const response = await agent
      .get("/api/v2/record?recordIds[]=13")
      .expect(200);
    expect((response.body as ArchiveRecord[]).length).toEqual(0);
  });
  test("expect to not return a record shared with a deleted membership", async () => {
    (extractUserEmailFromAuthToken as jest.Mock).mockImplementation(
      (req: Request, _: Response, next: NextFunction) => {
        (req.body as { emailFromAuthToken: string }).emailFromAuthToken =
          "test+2@permanent.org";
        next();
      }
    );
    const response = await agent
      .get("/api/v2/record?recordIds[]=2")
      .expect(200);
    expect((response.body as ArchiveRecord[]).length).toEqual(0);
  });
  test("expect to not return a record with a deleted parent folder", async () => {
    const response = await agent
      .get("/api/v2/record?recordIds[]=14")
      .expect(200);
    expect((response.body as ArchiveRecord[]).length).toEqual(0);
  });
  test("expect to log error and return 500 if database lookup fails", async () => {
    const testError = new Error("test error");
    jest.spyOn(db, "sql").mockImplementation(async () => {
      throw testError;
    });

    await agent.get("/api/v2/record?recordIds[]=14").expect(500);
    expect(logger.error).toHaveBeenCalledWith(testError);
  });
});
