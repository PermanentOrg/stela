/** @format */

import request from "supertest";
import type { NextFunction, Request } from "express";
import { app } from "../app";
import { verifyUserAuthentication } from "../middleware";
import type { TwoFactorRequest, TwoFactorRequestResponse } from "./models";
import { fusionAuthClient } from "../fusionauth";

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

  test("should return invalid request status if email from auth token is not an email", async () => {
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

  test("should return an array with the length equal to 1 is the user has one multi factor method enabled", async () => {
    fusionAuthClient.retrieveUserByEmail = jest.fn().mockResolvedValue({
      response: {
        user: {
          twoFactor: {
            methods: [
              {
                id: "1234",
                method: "email",
                value: "test@example.com",
              },
            ],
          },
        },
      },
    });

    const response = await agent.get("/api/v2/idpuser");
    const responseBody = response.body as TwoFactorRequestResponse[];

    expect(responseBody.length).toEqual(1);
  });

  test("should return an array with the length equal to 2 is the user has both multi factor methods enabled", async () => {
    fusionAuthClient.retrieveUserByEmail = jest.fn().mockResolvedValue({
      response: {
        user: {
          twoFactor: {
            methods: [
              {
                id: "1234",
                method: "email",
                value: "test@example.com",
              },
              {
                id: "5678",
                method: "sms",
                value: "+1234567890",
              },
            ],
          },
        },
      },
    });

    const response = await agent.get("/api/v2/idpuser");
    const responseBody = response.body as TwoFactorRequestResponse[];

    expect(responseBody.length).toEqual(2);
  });
});
