import { Router, type Request, type Response } from "express";

export const idpUserController = Router();

idpUserController.get("/", (req: Request, res: Response) => {
  res.send("Hello, World!");
});