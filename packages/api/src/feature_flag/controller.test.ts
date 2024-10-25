import request from "supertest";
import type { NextFunction, Request } from "express";
import { logger } from "@stela/logger";
import createError from "http-errors";
import { db } from "../database";
import { app } from "../app";
import {
  extractUserIsAdminFromAuthToken,
  verifyAdminAuthentication,
} from "../middleware";
import type {
  CreateFeatureFlagRequest,
  UpdateFeatureFlagRequest,
  FeatureFlagRequest,
} from "./models";

jest.mock("../database");
jest.mock("../middleware");
jest.mock("@stela/logger");

const loadFixtures = async (): Promise<void> => {
  await db.sql("fixtures.create_test_feature_flags");
};

const clearDatabase = async (): Promise<void> => {
  await db.query("TRUNCATE feature_flag CASCADE");
};

const notExistingFeatureFlagId = "1bdf2da6-026b-4e8e-9b57-a86b1817be4d";

describe("GET /feature-flags", () => {
  const agent = request(app);

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

describe("POST /feature-flag", () => {
  const agent = request(app);
  beforeEach(async () => {
    (verifyAdminAuthentication as jest.Mock).mockImplementation(
      (req: Request, __, next: NextFunction) => {
        (req.body as CreateFeatureFlagRequest).emailFromAuthToken =
          "test@permanent.org";
        (req.body as CreateFeatureFlagRequest).adminSubjectFromAuthToken =
          "6b640c73-4963-47de-a096-4a05ff8dc5f5";
        next();
      }
    );
    jest.restoreAllMocks();
    jest.clearAllMocks();
    await loadFixtures();
    await clearDatabase();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    await clearDatabase();
  });

  test("should respond with a 200 status code", async () => {
    await agent
      .post("/api/v2/feature-flags")
      .send({
        name: "TEST",
        description: "description",
      })
      .expect(200);
  });

  test("should respond with a 400 if feature flag already exists", async () => {
    await agent
      .post("/api/v2/feature-flags")
      .send({
        name: "TEST",
        description: "description",
      })
      .expect(200);

    // trying to create again the same feature flag should fail
    await agent
      .post("/api/v2/feature-flags")
      .send({
        name: "TEST",
        description: "description",
      })
      .expect(400);
  });

  test("should respond with 401 status code if lacking admin authentication", async () => {
    (verifyAdminAuthentication as jest.Mock).mockImplementation(
      (_: Request, __, next: NextFunction) => {
        next(new createError.Unauthorized("You aren't logged in"));
      }
    );
    await agent.post("/api/v2/feature-flags").expect(401);
  });

  test("should respond with 400 status code if missing emailFromAuthToken", async () => {
    (verifyAdminAuthentication as jest.Mock).mockImplementation(
      (req: Request, __, next: NextFunction) => {
        (req.body as CreateFeatureFlagRequest).adminSubjectFromAuthToken =
          "6b640c73-4963-47de-a096-4a05ff8dc5f5";
        next();
      }
    );
    await agent
      .post("/api/v2/feature-flags")
      .send({
        name: "TEST",
        description: "description",
      })
      .expect(400);
  });

  test("should respond with 400 status code if emailFromAuthToken is not a string", async () => {
    (verifyAdminAuthentication as jest.Mock).mockImplementation(
      (req: Request, __, next: NextFunction) => {
        (req.body as { emailFromAuthToken: number }).emailFromAuthToken = 123;
        (req.body as CreateFeatureFlagRequest).adminSubjectFromAuthToken =
          "6b640c73-4963-47de-a096-4a05ff8dc5f5";
        next();
      }
    );
    await agent
      .post("/api/v2/feature-flags")
      .send({
        name: "TEST",
        description: "description",
      })
      .expect(400);
  });

  test("should respond with 400 status name if code is missing", async () => {
    await agent
      .post("/api/v2/feature-flags")
      .send({
        description: "description",
      })
      .expect(400);
  });

  test("should respond with 400 status code if name is not a string", async () => {
    await agent
      .post("/api/v2/feature-flags")
      .send({
        name: 123,
        description: "description",
      })
      .expect(400);
  });

  test("should store the new feature flag in the database", async () => {
    await agent
      .post("/api/v2/feature-flags")
      .send({
        name: "name",
        description: "description",
      })
      .expect(200);
    const result = await db.query(
      `SELECT
        name,
        description,
        globally_enabled::boolean as "globallyEnabled"
      FROM
        feature_flag
      WHERE
        name = 'name'`
    );
    expect(result.rows.length).toBe(1);
    expect(result.rows[0]).toEqual({
      name: "name",
      description: "description",
      globallyEnabled: false,
    });
  });

  test("should respond with 500 if the database call fails", async () => {
    jest.spyOn(db, "sql").mockImplementation(() => {
      throw new Error("SQL error");
    });
    await agent
      .post("/api/v2/feature-flags")
      .send({
        name: "name",
        description: "description",
      })
      .expect(500);
  });

  test("should log the error if the database call fails", async () => {
    const testError = new Error("SQL error");
    jest.spyOn(db, "sql").mockRejectedValueOnce(testError);
    await agent
      .post("/api/v2/feature-flags")
      .send({
        name: "name",
        description: "description",
      })
      .expect(500);
    expect(logger.error).toHaveBeenCalled();
  });
});

describe("PUT /feature-flag/:featureFlagId", () => {
  const agent = request(app);
  beforeEach(async () => {
    (verifyAdminAuthentication as jest.Mock).mockImplementation(
      (req: Request, __, next: NextFunction) => {
        (req.body as UpdateFeatureFlagRequest).emailFromAuthToken =
          "test@permanent.org";
        (req.body as UpdateFeatureFlagRequest).adminSubjectFromAuthToken =
          "6b640c73-4963-47de-a096-4a05ff8dc5f5";
        next();
      }
    );
    jest.restoreAllMocks();
    jest.clearAllMocks();
    await clearDatabase();
    await loadFixtures();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    await clearDatabase();
  });

  test("should respond with a 200 status code", async () => {
    await agent
      .put("/api/v2/feature-flags/1bdf2da6-026b-4e8e-9b57-a86b1817be5d")
      .send({
        description: "a description",
        globallyEnabled: false,
      })
      .expect(200);
  });

  test("should respond with 401 status code if lacking admin authentication", async () => {
    (verifyAdminAuthentication as jest.Mock).mockImplementation(
      (_: Request, __, next: NextFunction) => {
        next(new createError.Unauthorized("You aren't logged in"));
      }
    );
    await agent
      .put("/api/v2/feature-flags/1bdf2da6-026b-4e8e-9b57-a86b1817be5d")
      .expect(401);
  });

  test("should respond with 400 status code if missing emailFromAuthToken", async () => {
    (verifyAdminAuthentication as jest.Mock).mockImplementation(
      (req: Request, __, next: NextFunction) => {
        (req.body as UpdateFeatureFlagRequest).adminSubjectFromAuthToken =
          "6b640c73-4963-47de-a096-4a05ff8dc5f5";
        next();
      }
    );
    await agent
      .put("/api/v2/feature-flags/1bdf2da6-026b-4e8e-9b57-a86b1817be5d")
      .send({
        description: "description",
        globallyEnabled: true,
      })
      .expect(400);
  });

  test("should respond with 400 status code if emailFromAuthToken is not a string", async () => {
    (verifyAdminAuthentication as jest.Mock).mockImplementation(
      (req: Request, __, next: NextFunction) => {
        (req.body as { emailFromAuthToken: number }).emailFromAuthToken = 123;
        (req.body as UpdateFeatureFlagRequest).adminSubjectFromAuthToken =
          "6b640c73-4963-47de-a096-4a05ff8dc5f5";
        next();
      }
    );
    await agent
      .put("/api/v2/feature-flags/1bdf2da6-026b-4e8e-9b57-a86b1817be5d")
      .send({
        description: "description",
        globallyEnabled: true,
      })
      .expect(400);
  });

  test("should respond with 400 status if globallyEnabled is missing", async () => {
    await agent
      .put("/api/v2/feature-flags/1bdf2da6-026b-4e8e-9b57-a86b1817be5d")
      .send({
        description: "description",
      })
      .expect(400);
  });

  test("should respond with 400 status code if globallyEnabled is not a boolean", async () => {
    await agent
      .put("/api/v2/feature-flags/1bdf2da6-026b-4e8e-9b57-a86b1817be5d")
      .send({
        description: "description",
        globallyEnabled: "a string",
      })
      .expect(400);
  });

  test("should respond with 400 status code if description is not a text", async () => {
    await agent
      .put("/api/v2/feature-flags/1bdf2da6-026b-4e8e-9b57-a86b1817be5d")
      .send({
        description: 1,
        globallyEnabled: true,
      })
      .expect(400);
  });

  test("should update the feature flag in the database", async () => {
    await agent
      .put("/api/v2/feature-flags/1bdf2da6-026b-4e8e-9b57-a86b1817be5d")
      .send({
        description: "a description",
        globallyEnabled: false,
      })
      .expect(200);
    const result = await db.query(
      `SELECT
        description,
        globally_enabled::boolean as "globallyEnabled"
      FROM
        feature_flag
      WHERE
        id = '1bdf2da6-026b-4e8e-9b57-a86b1817be5d'`
    );
    expect(result.rows.length).toBe(1);
    expect(result.rows[0]).toEqual({
      description: "a description",
      globallyEnabled: false,
    });
  });

  test("should respond with 500 if the database call fails", async () => {
    jest.spyOn(db, "sql").mockImplementation(() => {
      throw new Error("SQL error");
    });
    await agent
      .put("/api/v2/feature-flags/1bdf2da6-026b-4e8e-9b57-a86b1817be5d")
      .send({
        description: "description",
        globallyEnabled: true,
      })
      .expect(500);
  });

  test("should log the error if the database call fails", async () => {
    const testError = new Error("SQL error");
    jest.spyOn(db, "sql").mockRejectedValueOnce(testError);
    await agent
      .put("/api/v2/feature-flags/1bdf2da6-026b-4e8e-9b57-a86b1817be5d")
      .send({
        description: "description",
        globallyEnabled: true,
      })
      .expect(500);
    expect(logger.error).toHaveBeenCalled();
  });

  test("should respond with 404 status code if feature flag does not exist", async () => {
    await agent
      .put(`/api/v2/feature-flags/${notExistingFeatureFlagId}`)
      .send({
        description: "description",
        globallyEnabled: true,
      })
      .expect(404);
  });
});
