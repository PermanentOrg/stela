import { Router, type Request, type Response } from "express";

export const recordController = Router();

recordController.get("/get", (req: Request, res: Response) => {
  res.send("Hello, World!");
});
