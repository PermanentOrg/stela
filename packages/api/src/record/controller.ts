import { Router, type Request, type Response } from "express";
import { verifyUserAuthentication } from "../middleware";

export const recordController = Router();

recordController.get(
  "/get",
  verifyUserAuthentication,
  (_req: Request, res: Response) => {
    res.send("Hello, World!");
  }
);
