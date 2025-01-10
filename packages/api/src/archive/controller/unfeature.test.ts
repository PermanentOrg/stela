import request from "supertest";
import type { Request, NextFunction } from "express";
import { logger } from "@stela/logger";
import { app } from "../../app";
import { db } from "../../database";
import { verifyAdminAuthentication } from "../../middleware";
import { archiveService } from "../service/index";

jest.mock("../../database");
jest.mock("../../middleware");
jest.mock("@stela/logger");

const loadFixtures = async (): Promise<void> => {
  await db.sql("archive.fixtures.create_test_accounts");
  await db.sql("archive.fixtures.create_test_archives");
  await db.sql("archive.fixtures.create_test_featured_archives");
  await db.sql("archive.fixtures.create_test_folders");
  await db.sql("archive.fixtures.create_test_profile_items");
};

const clearDatabase = async (): Promise<void> => {
  await db.query(
    "TRUNCATE account, archive, featured_archive, folder, profile_item CASCADE"
  );
};

describe("getFeatured", () => {
  const agent = request(app);
  beforeEach(async () => {
    (verifyAdminAuthentication as jest.Mock).mockImplementation(
      (req: Request, _: Response, next: NextFunction) => {
        (req.body as { emailFromAuthToken: string }).emailFromAuthToken =
          "test+1@permanent.org";
        (
          req.body as { adminSubjectFromAuthToken: string }
        ).adminSubjectFromAuthToken = "82bd483e-914b-4bfe-abf9-92ffe86d7803";
        next();
      }
    );
    await loadFixtures();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  test("should remove archive from featured archives", async () => {
    const initialResult = await archiveService.getFeatured();
    expect(initialResult).toHaveLength(1);
    await agent.delete("/api/v2/archive/3/unfeature").expect(200);
    const result = await archiveService.getFeatured();
    expect(result).toHaveLength(0);
  });

  test("should throw InternalServerError if database query fails", async () => {
    const testError = new Error("error: out of cheese - redo from start");
    jest.spyOn(db, "sql").mockRejectedValueOnce(testError);
    await agent.delete("/api/v2/archive/3/unfeature").expect(500);
    expect(logger.error).toHaveBeenCalledWith(testError);
  });
});
