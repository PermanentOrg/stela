import { BadRequest, InternalServerError } from "http-errors";
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
};

const clearDatabase = async (): Promise<void> => {
  await db.query("TRUNCATE account, archive, featured_archive CASCADE");
};

describe("makeFeatured", () => {
  beforeEach(async () => {
    await loadFixtures();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  test("should make an archive featured", async () => {
    const archiveId = "3";

    await archiveService.makeFeatured(archiveId);

    const result = await db.query<{ archiveId: string }>(
      'SELECT archive_id "archiveId" FROM featured_archive WHERE archive_id = :archiveId',
      { archiveId }
    );
    expect(result.rows[0]).toBeDefined();
    expect(result.rows[0]?.archiveId).toBe(archiveId);
  });

  test("should throw a BadRequest error if archive doesn't exist", async () => {
    let error = null;
    const archiveId = "1000000";

    try {
      await archiveService.makeFeatured(archiveId);
    } catch (err) {
      error = err;
    } finally {
      expect(error instanceof BadRequest).toBe(true);
    }
  });

  test("should throw a BadRequest error if archive isn't public", async () => {
    let error = null;
    const archiveId = "1";

    try {
      await archiveService.makeFeatured(archiveId);
    } catch (err) {
      error = err;
    } finally {
      expect(error instanceof BadRequest).toBe(true);
    }
  });

  test("should throw a BadRequest error if archive is already featured", async () => {
    let error = null;
    const archiveId = "3";
    await archiveService.makeFeatured(archiveId);

    try {
      await archiveService.makeFeatured(archiveId);
    } catch (err) {
      error = err;
    } finally {
      expect(error instanceof BadRequest).toBe(true);
    }
  });

  test("should throw an InternalServerError if database query fails", async () => {
    let error = null;
    const archiveId = "3";
    const testError = new Error("error: out of cheese - redo from start");
    jest.spyOn(db, "sql").mockRejectedValueOnce(testError);
    try {
      await archiveService.makeFeatured(archiveId);
    } catch (err) {
      error = err;
    } finally {
      expect(logger.error).toHaveBeenCalledWith(testError);
      expect(error instanceof InternalServerError).toBe(true);
    }
  });
});
