/** @format */

import request from "supertest";
import type { NextFunction, Request } from "express";
import { app } from "../app";
import { verifyUserAuthentication } from "../middleware";
import type { TwoFactorRequest } from "./models";

jest.mock("../middleware");

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
});
