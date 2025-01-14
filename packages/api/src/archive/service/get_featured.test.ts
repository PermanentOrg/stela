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

  test("should retrieve featured archives", async () => {
    const result = await archiveService.getFeatured();
    expect(result).toHaveLength(1);
    expect(result[0]?.archiveId).toBe("3");
    expect(result[0]?.name).toBe("Jay Rando");
    expect(result[0]?.type).toBe("type.archive.person");
    expect(result[0]?.archiveNbr).toBe("0001-0003");
    expect(result[0]?.profileImage).toBe("https://test-archive-thumbnail");
    expect(result[0]?.bannerImage).toBe("https://test-folder-thumbnail");
  });

  test("should throw InternalServerError if database query fails", async () => {
    let error = null;
    const testError = new Error("error: out of cheese - redo from start");
    jest.spyOn(db, "sql").mockRejectedValueOnce(testError);
    try {
      await archiveService.getFeatured();
    } catch (err) {
      error = err;
    } finally {
      expect(error).toBeInstanceOf(InternalServerError);
      expect(logger.error).toHaveBeenCalledWith(testError);
    }
  });
});
