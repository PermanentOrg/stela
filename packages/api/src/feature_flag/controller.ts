import { Router } from "express";
import type { Request, Response, NextFunction } from "express";

import { logger } from "@stela/logger";
import { featureService } from "./service";
import { extractUserIsAdminFromAuthToken } from "../middleware";
import { validateIsAdminFromAuthentication } from "../validators/shared";
import { isValidationError } from "../validators/validator_util";

export const featureController = Router();

featureController.get(
  "/",
  extractUserIsAdminFromAuthToken,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      validateIsAdminFromAuthentication(req.body);
      const featureFlags = await featureService.getFeatureFlags(req.body.admin);
      res.json({ items: featureFlags });
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
