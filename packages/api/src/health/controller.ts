import type { Handler, Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { healthService } from "./service";

const getHealth: Handler = asyncHandler(
  async (_: Request, res: Response): Promise<void> => {
    res.json({
      status: await healthService.getHealth(),
    });
  }
);

export const healthController = {
  getHealth,
};
