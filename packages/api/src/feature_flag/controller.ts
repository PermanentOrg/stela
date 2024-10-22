import { Router } from "express";
import type { Request, Response, NextFunction } from "express";

import { logger } from "@stela/logger";
import { featureService } from "./service";
import { createFeatureService } from "./service/create";
import {
  extractUserIsAdminFromAuthToken,
  verifyAdminAuthentication,
} from "../middleware";
import { validateCreateFeatureFlagRequest } from "./validators";
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

featureController.post(
  "/",
  verifyAdminAuthentication,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      validateCreateFeatureFlagRequest(req.body);
      const insertedFeatureFlag = await createFeatureService.createFeatureFlag(
        req.body
      );
      res.status(200).send({ data: insertedFeatureFlag });
    } catch (err) {
      if (isValidationError(err)) {
        res.status(400).json({ error: err.message });
        return;
      }
      next(err);
    }
  }
);
