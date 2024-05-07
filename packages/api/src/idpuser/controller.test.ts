/** @format */

import request from "supertest";
import type { NextFunction, Request } from "express";
import { app } from "../app";
import { verifyUserAuthentication } from "../middleware";
import type { TwoFactorRequest } from "./models";
import fetch from "node-fetch";
import type { Response } from "node-fetch";

jest.mock("node-fetch", () => jest.fn());
jest.mock("../middleware");

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

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
    const mockResponse = [
      {
        id: "1234",
        method: "email",
        value: "test@example.com",
      },
    ];

    mockFetch.mockResolvedValueOnce({
      json: async () => mockResponse,
    } as unknown as Response);

    const response = await agent.get("/api/v2/idpuser");

    expect(response.body.length).toEqual(1);
  });

  test("should return an array with the length equal to 2 is the user has both multi factor methods enabled", async () => {
    const mockResponse = [
      {
        id: "1234",
        method: "email",
        value: "test@example.com",
      },
      {
        id: "5678",
        method: "sms",
        value: "123456789",
      },
    ];

    mockFetch.mockResolvedValueOnce({
      json: async () => mockResponse,
    } as unknown as Response);

    const response = await agent.get("/api/v2/idpuser");

    expect(response.body.length).toEqual(2);
  });
});
