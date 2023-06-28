import { InternalServerError } from "http-errors";
import { db } from "../database";
import { archiveService } from "./service";
import { logger } from "../log";

jest.mock("../database");
jest.mock("../log", () => ({
  logger: {
    error: jest.fn(),
  },
}));

const loadFixtures = async (): Promise<void> => {
  await db.sql("fixtures.create_test_accounts");
  await db.sql("fixtures.create_test_archive");
  await db.sql("fixtures.create_test_records");
  await db.sql("fixtures.create_test_folders");
  await db.sql("fixtures.create_test_tags");
  await db.sql("fixtures.create_test_tag_links");
};

const clearDatabase = async (): Promise<void> => {
  await db.query(
    "TRUNCATE account, archive, record, folder, tag, tag_link CASCADE"
  );
};

describe("getPublicTags", () => {
  beforeEach(async () => {
    await clearDatabase();
    await loadFixtures();
  });
  afterEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
  });

  test("should return public tags and not private or deleted tags", async () => {
    const tags = await archiveService.getPublicTags("1");
    expect(tags.length).toEqual(2);
    expect(tags.map((tag) => tag.name)).toContain("test_public_file");
    expect(tags.map((tag) => tag.name)).toContain("test_public_folder");
  });

  test("should return empty list for nonexistent archive", async () => {
    const tags = await archiveService.getPublicTags("1000");
    expect(tags.length).toEqual(0);
  });

  test("should throw an internal server error if database query fails unexpectedly", async () => {
    let error = null;
    const testError = new Error("out of cheese - redo from start");
    try {
      jest.spyOn(db, "sql").mockRejectedValueOnce(testError);
      await archiveService.getPublicTags("1");
    } catch (err) {
      error = err;
    } finally {
      expect(error instanceof InternalServerError).toEqual(true);
      expect(logger.error).toHaveBeenCalledWith(testError);
    }
  });
});
