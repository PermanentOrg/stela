import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { logger } from "@stela/logger";
import {
  verifyUserAuthentication,
  verifyUserOrAdminAuthentication,
  extractIp,
} from "../middleware";
import { validateCreateEventRequest } from "./validators";
import { isValidationError } from "../validators/validator_util";
import { validateBodyFromAuthentication } from "../validators/shared";
import { createEvent, getChecklistEvents } from "./service";

export const eventController = Router();

eventController.post(
  "/",
  verifyUserOrAdminAuthentication,
  extractIp,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      validateCreateEventRequest(req.body);
      const userAgent = req.body.userAgent ?? req.headers["user-agent"];
      if (userAgent !== undefined) {
        req.body.userAgent = userAgent;
      }
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

eventController.get(
  "/checklist",
  verifyUserAuthentication,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      validateBodyFromAuthentication(req.body);
      const response = await getChecklistEvents(req.body.emailFromAuthToken);
      res.status(200).json({ checklistItems: response });
    } catch (err) {
      if (isValidationError(err)) {
        res.status(400).json({ error: err.message });
        return;
      }
      next(err);
    }
  }
);
