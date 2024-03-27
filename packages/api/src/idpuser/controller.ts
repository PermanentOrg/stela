/** @format */

import { Router, type Response, type Request } from "express";
import { verifyUserAuthentication } from "../middleware";

export const idpUserController = Router();

idpUserController.get(
  "/",
  verifyUserAuthentication,
  async (_: Request, res: Response) => {
    res.send("Hello, World!");
  }
);
