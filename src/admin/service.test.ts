import { InternalServerError } from "http-errors";
import { db } from "../database";
import { logger } from "../log";
import { publisherClient } from "../publisher_client";
import type { Message } from "../publisher_client";
import { adminService } from "./service";

jest.mock("../database");
jest.mock("../log", () => ({
  logger: {
    error: jest.fn(),
  },
}));
jest.mock("../publisher_client");

const loadFixtures = async (): Promise<void> => {
  await db.sql("fixtures.create_test_folders");
};

const clearDatabase = async (): Promise<void> => {
  await db.query("TRUNCATE folder CASCADE");
};

describe("recalculateFolderThumbnails", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await clearDatabase();
    await loadFixtures();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  test("should send messages for folders created before the cutoff", async () => {
    jest
      .spyOn(publisherClient, "batchPublishMessages")
      .mockResolvedValueOnce({ failedMessages: [], messagesSent: 4 });
    const result = await adminService.recalculateFolderThumbnails(
      new Date(new Date().setDate(new Date().getDate() - 1)),
      new Date()
    );
    expect(
      (
        (
          (publisherClient.batchPublishMessages as jest.Mock).mock.calls[0] as [
            string,
            Message[]
          ]
        )[1] as unknown as Message[]
      ).length
    ).toBe(4);
    expect(result).toEqual({ failedFolders: [], messagesSent: 4 });
  });

  test("should throw internal server error if database call fails", async () => {
    let error = null;
    const testError = new Error("out of cheese - redo from start");
    jest.spyOn(db, "sql").mockRejectedValueOnce(testError);
    try {
      await adminService.recalculateFolderThumbnails(
        new Date(new Date().setDate(new Date().getDate() - 1)),
        new Date()
      );
    } catch (err) {
      error = err;
    } finally {
      expect(logger.error).toHaveBeenCalledWith(testError);
      expect(error instanceof InternalServerError).toEqual(true);
    }
  });

  test("should throw internal server error if message publishing fails", async () => {
    let error = null;
    const testError = new Error("out of cheese - redo from start");
    jest
      .spyOn(publisherClient, "batchPublishMessages")
      .mockRejectedValueOnce(testError);
    try {
      await adminService.recalculateFolderThumbnails(
        new Date(new Date().setDate(new Date().getDate() - 1)),
        new Date()
      );
    } catch (err) {
      error = err;
    } finally {
      expect(logger.error).toHaveBeenCalledWith(testError);
      expect(error instanceof InternalServerError).toEqual(true);
    }
  });
});
