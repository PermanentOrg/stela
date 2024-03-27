/** @format */

import request from "supertest";
import type { NextFunction, Request } from "express";
import { app } from "../app";
import { verifyUserAuthentication } from "../middleware";

describe("/idpuser", () => {
  const agent = request(app);
  beforeEach(async () => {
    (verifyUserAuthentication as jest.Mock).mockImplementation(
      (req: Request, __, next: NextFunction) => {
        req.body.emailFromAuthToken = "test@permanent.org";
        next();
      }
    );
  });
  test("expect a non-404 response", async () => {
    await agent.get("/api/v2/idpuser").expect(200);
  });

  // test("expect the user email from the token", async () => {
  //   const response = await agent.get("/api/v2/idpuser");

  //   expect(response.status).toBe(200);
  //   expect(response.body.email).toEqual("test@permanent.org");
  // });
});
