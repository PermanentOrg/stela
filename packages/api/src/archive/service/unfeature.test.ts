import { InternalServerError } from "http-errors";
import { logger } from "@stela/logger";
import { db } from "../../database";
import { archiveService } from "./index";

jest.mock("../../database");
jest.mock("@stela/logger", () => ({
  logger: {
    error: jest.fn(),
  },
}));

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
  beforeEach(async () => {
    await loadFixtures();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  test("should remove archive from featured archives", async () => {
    await archiveService.unfeature("3");
    const result = await archiveService.getFeatured();
    expect(result).toHaveLength(0);
  });

  test("should throw InternalServerError if database query fails", async () => {
    let error = null;
    const testError = new Error("error: out of cheese - redo from start");
    jest.spyOn(db, "sql").mockRejectedValueOnce(testError);
    try {
      await archiveService.unfeature("3");
    } catch (err) {
      error = err;
    } finally {
      expect(error).toBeInstanceOf(InternalServerError);
      expect(logger.error).toHaveBeenCalledWith(testError);
    }
  });
});
