import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { logger } from "@stela/logger";
import { verifyUserOrAdminAuthentication, extractIp } from "../middleware";
import { validateCreateEventRequest } from "./validators";
import { isValidationError } from "../validators/validator_util";
import { createEvent } from "./service";

export const eventController = Router();

eventController.post(
  "/",
  verifyUserOrAdminAuthentication,
  extractIp,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      validateCreateEventRequest(req.body);
      await createEvent(req.body);
      res.status(200).json({});
    } catch (err) {
      logger.error(err);
      if (isValidationError(err)) {
        res.status(400).json({ error: err.message });
        return;
      }
      next(err);
    }
  }
);
