import request from "supertest";
import type { NextFunction, Request } from "express";
import createError from "http-errors";
import { app } from "../app";
import { verifyUserAuthentication } from "../middleware";
import { fusionAuthClient } from "../fusionauth";
import type { TwoFactorRequestResponse, SendEnableCodeRequest } from "./models";
import { db } from "../database";

interface TwoFactorRequest {
  emailFromAuthToken: string;
}

jest.mock("../database");
jest.mock("node-fetch", () => jest.fn());
jest.mock("../middleware");
jest.mock("../fusionauth");

describe("/idpuser", () => {
  const agent = request(app);
  beforeEach(async () => {
    (verifyUserAuthentication as jest.Mock).mockImplementation(
      (req: Request, __, next: NextFunction) => {
        (req.body as TwoFactorRequest).emailFromAuthToken =
          "test@permanent.org";
        next();
      }
    );

    (fusionAuthClient.retrieveUserByEmail as jest.Mock).mockResolvedValue({
      response: {
        user: {
          twoFactor: {
            methods: [],
          },
        },
      },
    });
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  test("expect a non-404 response", async () => {
    await agent.get("/api/v2/idpuser").expect(200);
  });

  test("should return invalid request status if the value from the auth token is not a valid email", async () => {
    (verifyUserAuthentication as jest.Mock).mockImplementation(
      (req: Request, __, next: NextFunction) => {
        (req.body as TwoFactorRequest).emailFromAuthToken = "not_an_email";
        next();
      }
    );
    await agent.get("/api/v2/idpuser").expect(400);
  });

  test("should return invalid request status if there is no email in the auth token", async () => {
    (verifyUserAuthentication as jest.Mock).mockImplementation(
      (_: Request, __, next: NextFunction) => {
        next();
      }
    );
    await agent.get("/api/v2/idpuser").expect(400);
  });

  test("should return an array", async () => {
    const response = await agent.get("/api/v2/idpuser");
    expect(response.body).toBeInstanceOf(Array);
  });

  test("should return an array with the length equal to 1 if the user has one multi factor method enabled", async () => {
    (fusionAuthClient.retrieveUserByEmail as jest.Mock).mockResolvedValue({
      response: {
        user: {
          twoFactor: {
            methods: [
              {
                id: "1234",
                method: "email",
                email: "test@example.com",
                mobilePhone: "",
              },
            ],
          },
        },
      },
    });

    const response = await agent.get("/api/v2/idpuser");

    expect((response.body as TwoFactorRequestResponse[]).length).toEqual(1);
  });

  test("should return an array with the length equal to 2 if the user has both multi factor methods enabled", async () => {
    const methods = [
      { id: "1", method: "email", email: "test1@example.com", mobilePhone: "" },
      { id: "2", method: "sms", mobilePhone: "1234567890", email: "" },
    ];

    (fusionAuthClient.retrieveUserByEmail as jest.Mock).mockResolvedValue({
      response: {
        user: {
          twoFactor: {
            methods,
          },
        },
      },
    });

    const response = await agent.get("/api/v2/idpuser");

    expect((response.body as TwoFactorRequestResponse[]).length).toEqual(2);
  });

  test("should return a 500 status if getTwoFactorMethods throws an error", async () => {
    (fusionAuthClient.retrieveUserByEmail as jest.Mock).mockRejectedValue(
      new Error("Unexpected error")
    );

    const response = await agent.get("/api/v2/idpuser");
    expect(response.status).toBe(500);
  });

  test("should correctly map values when there are two-factor methods", async () => {
    const methods = [
      { id: "1", method: "email", email: "test1@example.com", mobilePhone: "" },
      { id: "2", method: "sms", mobilePhone: "1234567890", email: "" },
    ];

    (fusionAuthClient.retrieveUserByEmail as jest.Mock).mockResolvedValue({
      response: {
        user: {
          twoFactor: {
            methods,
          },
        },
      },
    });

    const expected = [
      { methodId: "1", method: "email", value: "test1@example.com" },
      { methodId: "2", method: "sms", value: "1234567890" },
    ];

    const response = await agent.get("/api/v2/idpuser");

    expect(response.body).toEqual(expected);
  });
});

describe("idpuser/send-enable-code", () => {
  const agent = request(app);

  const loadFixtures = async (): Promise<void> => {
    await db.sql("fixtures.create_test_accounts");
  };

  const clearDatabase = async (): Promise<void> => {
    await db.query("TRUNCATE account CASCADE;");
  };

  beforeEach(async () => {
    (verifyUserAuthentication as jest.Mock).mockImplementation(
      (req: Request, __, next: NextFunction) => {
        (req.body as SendEnableCodeRequest).emailFromAuthToken =
          "test@permanent.org";
        next();
      }
    );

    (
      fusionAuthClient.sendTwoFactorCodeForEnableDisable as jest.Mock
    ).mockResolvedValue({
      wasSuccessful: () => true,
    });

    await loadFixtures();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  test("should return a 200 status if the request is successful", async () => {
    await agent
      .post("/api/v2/idpuser/send-enable-code")
      .send({ method: "email", value: "test@permanent.org" })
      .expect(200);
  });

  test("should return a 401 status if the request is not authenticated", async () => {
    (verifyUserAuthentication as jest.Mock).mockImplementation(
      (_: Request, __, next: NextFunction) => {
        next(createError(401, "Unauthorized"));
      }
    );
    await agent.post("/api/v2/idpuser/send-enable-code").expect(401);
  });

  test("should return a 400 status if emailFromAuthToken is missing", async () => {
    (verifyUserAuthentication as jest.Mock).mockImplementation(
      (_: Request, __, next: NextFunction) => {
        next();
      }
    );
    await agent.post("/api/v2/idpuser/send-enable-code").expect(400);
  });

  test("should return a 400 status if emailFromAuthToken is not an email", async () => {
    (verifyUserAuthentication as jest.Mock).mockImplementation(
      (req: Request, _, next: NextFunction) => {
        (req.body as SendEnableCodeRequest).emailFromAuthToken = "not_an_email";
        next();
      }
    );
    await agent.post("/api/v2/idpuser/send-enable-code").expect(400);
  });

  test("should return a 400 status if method is missing", async () => {
    await agent.post("/api/v2/idpuser/send-enable-code").expect(400);
  });

  test("should return a 400 status if method is invalid", async () => {
    await agent
      .post("/api/v2/idpuser/send-enable-code")
      .send({ method: "invalid", value: "test@permanent.org" })
      .expect(400);
  });

  test("should return a 400 status if value is missing", async () => {
    await agent
      .post("/api/v2/idpuser/send-enable-code")
      .send({ method: "email" })
      .expect(400);
  });

  test("should return a 400 status if method is email and value is not an email", async () => {
    await agent
      .post("/api/v2/idpuser/send-enable-code")
      .send({ method: "email", value: "not_an_email" })
      .expect(400);
  });

  test("should call the fusionauth client to send the code", async () => {
    await agent
      .post("/api/v2/idpuser/send-enable-code")
      .send({ method: "email", value: "test@permanent.org" })
      .expect(200);
    expect(
      fusionAuthClient.sendTwoFactorCodeForEnableDisable
    ).toHaveBeenCalled();
  });

  test("should return a 404 status if the user doesn't exist in the database", async () => {
    await db.query("TRUNCATE account CASCADE;");
    await agent
      .post("/api/v2/idpuser/send-enable-code")
      .send({ method: "email", value: "test@permanent.org" })
      .expect(404);
  });

  test("should return a 500 status if the fusionauth client throws an error", async () => {
    (
      fusionAuthClient.sendTwoFactorCodeForEnableDisable as jest.Mock
    ).mockResolvedValue({
      wasSuccessful: () => false,
      exception: { code: "500", message: "test_message" },
    } as unknown as ReturnType<typeof fusionAuthClient.sendTwoFactorCodeForEnableDisable>);
    await agent
      .post("/api/v2/idpuser/send-enable-code")
      .send({ method: "email", value: "test@permanent.org" })
      .expect(500);
  });

  test("should return a 500 status if the database call fails", async () => {
    jest.spyOn(db, "sql").mockRejectedValue(new Error("test_error"));
    await agent
      .post("/api/v2/idpuser/send-enable-code")
      .send({ method: "email", value: "test@permanent.org" })
      .expect(500);
  });
});
