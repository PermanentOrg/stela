import { Router, type Response } from "express";

export const idpUserController = Router();

idpUserController.get("/", (res: Response) => {
  res.send("Hello, World!");
});