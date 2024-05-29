import request from "supertest";
import type { NextFunction, Request } from "express";
import { app } from "../app";
import { verifyUserAuthentication } from "../middleware";
import { fusionAuthClient } from "../fusionauth";
import type { TwoFactorRequestResponse } from "./models";

interface TwoFactorRequest {
  emailFromAuthToken: string;
}

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
