/** @format */

import { Router, type Response, type Request } from "express";

export const idpUserController = Router();

idpUserController.get("/", (_: Request, res: Response) => {
  res.send("Hello, World!");
});
