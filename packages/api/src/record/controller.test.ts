import type { NextFunction } from "express";
import createError from "http-errors";
import request from "supertest";
import { app } from "../app";
import { verifyUserAuthentication } from "../middleware";

jest.mock("../middleware");

fdescribe("record/get", () => {
  const agent = request(app);
  test("expect a 401 response", async () => {
    (verifyUserAuthentication as jest.Mock).mockImplementation(
      (_, __, next: NextFunction) =>
      {
        next( new createError.Unauthorized("You aren't logged in") );
      }
    );
    await agent.get("/api/v2/record/get").expect(401);
  });
  test("expect request to have an email from auth token", async () => {
    (verifyUserAuthentication as jest.Mock).mockImplementation(
      (_, __, next: NextFunction) =>
      {
        next();
      }
    );
    await agent.get("/api/v2/record/get").expect(400);
  });
});
