import { Router } from "express";
import type { Request, Response, NextFunction } from "express";

import { logger } from "@stela/logger";
import { verifyUserAuthentication } from "../middleware";
import { isValidationError } from "../validators/validator_util";
import { validateMyNotificationsParams } from "./validators";
import { notificationService } from "./service";
import { validateBodyFromAuthentication } from "../validators";

export const notificationController = Router();

notificationController.get(
  "/my-notifications/:archiveId/:lastNotificationId",
  verifyUserAuthentication,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      validateMyNotificationsParams(req.params);
      validateBodyFromAuthentication(req.body);
      req.body.emailFromAuthToken = "test@testt4.com";
      const notifications = await notificationService.getMyNotificationsSince(
        req.body.emailFromAuthToken,
        req.params.archiveId,
        req.params.lastNotificationId
      );
      res.json({ items: notifications });
    } catch (err) {
      if (isValidationError(err)) {
        res.status(400).json({ error: err.message });
        return;
      }
      logger.error(err);
      next(err);
    }
  }
);
