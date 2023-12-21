import request from "supertest";
import type { Request, NextFunction } from "express";
import { logger } from "@stela/logger";
import { app } from "../app";
import { db } from "../database";
import { publisherClient } from "../publisher_client";
import { verifyAdminAuthentication } from "../middleware";
import type { Message } from "../publisher_client";

jest.mock("../database");
jest.mock("@stela/logger");
jest.mock("../middleware");
jest.mock("../publisher_client");

const loadFixtures = async (): Promise<void> => {
  await db.sql("fixtures.create_test_folders");
};

const clearDatabase = async (): Promise<void> => {
  await db.query("TRUNCATE folder CASCADE");
};

describe("recalculateFolderThumbnails", () => {
  const agent = request(app);
  beforeEach(async () => {
    (verifyAdminAuthentication as jest.Mock).mockImplementation(
      (req: Request, __, next: NextFunction) => {
        (
          req.body as {
            beginTimestamp: Date;
            endTimestamp: Date;
            emailFromAuthToken: string;
          }
        ).emailFromAuthToken = "test@permanent.org";
        next();
      }
    );
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
    const result = await agent
      .post("/api/v2/admin/folder/recalculate_thumbnails")
      .send({
        beginTimestamp: new Date(new Date().setDate(new Date().getDate() - 1)),
        endTimestamp: new Date(),
      })
      .expect(200);
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
    expect(result.body).toEqual({ failedFolders: [], messagesSent: 4 });
  });

  test("should respond with 500 error if messages fail to send", async () => {
    jest
      .spyOn(publisherClient, "batchPublishMessages")
      .mockResolvedValueOnce({ failedMessages: ["1", "2"], messagesSent: 2 });
    const result = await agent
      .post("/api/v2/admin/folder/recalculate_thumbnails")
      .send({
        beginTimestamp: new Date(new Date().setDate(new Date().getDate() - 1)),
        endTimestamp: new Date(),
      })
      .expect(500);
    expect(result.body).toEqual({ failedFolders: ["1", "2"], messagesSent: 2 });
  });

  test("should respond with internal server error if database call fails", async () => {
    const testError = new Error("out of cheese - redo from start");
    jest.spyOn(db, "sql").mockRejectedValueOnce(testError);
    await agent
      .post("/api/v2/admin/folder/recalculate_thumbnails")
      .send({
        beginTimestamp: new Date(new Date().setDate(new Date().getDate() - 1)),
        endTimestamp: new Date(),
      })
      .expect(500);
    expect(logger.error).toHaveBeenCalledWith(testError);
  });

  test("should respond with internal server error if message publishing fails", async () => {
    const testError = new Error("out of cheese - redo from start");
    jest
      .spyOn(publisherClient, "batchPublishMessages")
      .mockRejectedValueOnce(testError);
    await agent
      .post("/api/v2/admin/folder/recalculate_thumbnails")
      .send({
        beginTimestamp: new Date(new Date().setDate(new Date().getDate() - 1)),
        endTimestamp: new Date(),
      })
      .expect(500);
    expect(logger.error).toHaveBeenCalledWith(testError);
  });

  test("should respond with bad request error if payload is invalid", async () => {
    await agent
      .post("/api/v2/admin/folder/recalculate_thumbnails")
      .send({})
      .expect(400);
  });
});
