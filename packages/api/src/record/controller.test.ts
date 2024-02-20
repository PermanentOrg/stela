import type { Response, NextFunction } from "express";
import createError from "http-errors";
import request from "supertest";
import { app } from "../app";
import { verifyUserAuthentication } from "../middleware";

jest.mock("../middleware");

fdescribe("record/get", () => {
  const agent = request(app);
  test("expect a 401 response", async () => {
    (verifyUserAuthentication as jest.Mock).mockImplementation(
      (_, __, next: NextFunction) => {
        next(new createError.Unauthorized("You aren't logged in"));
      }
    );
    await agent.get("/api/v2/record/get").expect(401);
  });
  test("expect request to have an email from auth token", async () => {
    (verifyUserAuthentication as jest.Mock).mockImplementation(
      (_, __, next: NextFunction) => {
        next();
      }
    );
    await agent.get("/api/v2/record/get").expect(400);
  });
  test("expect an empty query to cause a 400 error", async () => {
    (verifyUserAuthentication as jest.Mock).mockImplementation(
      (req, _: Response, next: NextFunction) => {
        req.body.emailFromAuthToken = "test@permanent.org";
        next();
      }
    );
    await agent.get("/api/v2/record/get").expect(400);
  });
  test("expect an invalid request to cause a 400 error", async () => {
    (verifyUserAuthentication as jest.Mock).mockImplementation(
      (req, _: Response, next: NextFunction) => {
        req.body.emailFromAuthToken = "test@permanent.org";
        next();
      }
    );
    await agent.get("/api/v2/record/get?recordIds=1").expect(400);
  });
});
