import request from "supertest";
import type { NextFunction, Request } from "express";
import { logger } from "@stela/logger";
import { db } from "../database";
import { app } from "../app";
import { extractUserIsAdminFromAuthToken } from "../middleware";
import type { FeatureFlagRequest } from "./models";

jest.mock("../database");
jest.mock("../middleware");
jest.mock("@stela/logger");

describe("GET /feature-flags", () => {
  const agent = request(app);

  const loadFixtures = async (): Promise<void> => {
    await db.sql("fixtures.create_test_feature_flags");
  };

  const clearDatabase = async (): Promise<void> => {
    await db.query("TRUNCATE feature_flag CASCADE");
  };

  beforeEach(async () => {
    await clearDatabase();
    await loadFixtures();
    (extractUserIsAdminFromAuthToken as jest.Mock).mockImplementation(
      (req: Request, __, next: NextFunction) => {
        (req.body as FeatureFlagRequest).admin = false;
        next();
      }
    );
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await clearDatabase();
  });

  test("should log the error if the database call fails", async () => {
    const testError = new Error("SQL error");
    jest.spyOn(db, "sql").mockRejectedValueOnce(testError);

    await agent.get("/api/v2/feature-flags").expect(500);
    expect(logger.error).toHaveBeenCalled();
  });

  test("should log the error if the database call fails when calling user is admin", async () => {
    (extractUserIsAdminFromAuthToken as jest.Mock).mockImplementation(
      (req: Request, __, next: NextFunction) => {
        (req.body as FeatureFlagRequest).admin = true;
        next();
      }
    );
    const testError = new Error("SQL error");
    jest.spyOn(db, "sql").mockRejectedValueOnce(testError);

    await agent.get("/api/v2/feature-flags").expect(500);
    expect(logger.error).toHaveBeenCalled();
  });

  test("should log the error if the request is invalid", async () => {
    (extractUserIsAdminFromAuthToken as jest.Mock).mockImplementation(
      (_req: Request, __, next: NextFunction) => {
        next();
      }
    );

    await agent.get("/api/v2/feature-flags").expect(400);
    expect(logger.error).toHaveBeenCalled();
  });

  test("should return list of globally enabled feature flags if user is not logged in", async () => {
    const expected = { items: [{ name: "feature_1" }] };

    const response = await agent.get("/api/v2/feature-flags").expect(200);
    expect(response.body).toEqual(expected);
  });

  test("should return list of all feature flags if user is admin", async () => {
    (extractUserIsAdminFromAuthToken as jest.Mock).mockImplementation(
      (req: Request, __, next: NextFunction) => {
        (req.body as FeatureFlagRequest).admin = true;
        next();
      }
    );

    const expected = {
      items: [
        {
          id: "1bdf2da6-026b-4e8e-9b57-a86b1817be5d",
          name: "feature_1",
          description: "description_1",
          globallyEnabled: true,
          createdAt: "2023-06-21T00:00:00.000Z",
          updatedAt: "2023-06-21T00:00:00.000Z",
        },
        {
          id: "96669879-dfbc-40c9-ba3d-00e688a158ba",
          name: "feature_2",
          description: "description_2",
          globallyEnabled: false,
          createdAt: "2023-06-21T00:00:00.000Z",
          updatedAt: "2023-06-21T00:00:00.000Z",
        },
      ],
    };

    const response = await agent.get("/api/v2/feature-flags").expect(200);
    expect(response.body).toEqual(expected);
  });
});
