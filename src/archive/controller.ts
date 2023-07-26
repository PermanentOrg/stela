import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { verifyUserAuthentication } from "../middleware";
import {
  validateArchiveIdFromParams,
  validateBodyFromAuthentication,
} from "./validators";
import { isValidationError } from "../validators/validator_util";
import { archiveService } from "./service";

export const archiveController = Router();
archiveController.get(
  "/:archiveId/tags/public",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      validateArchiveIdFromParams(req.params);
      const tags = await archiveService.getPublicTags(req.params.archiveId);
      res.json(tags);
    } catch (err) {
      if (isValidationError(err)) {
        res.status(400).json({ error: err });
        return;
      }
      next(err);
    }
  }
);

archiveController.get(
  "/:archiveId/payer-account-storage",
  verifyUserAuthentication,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      validateArchiveIdFromParams(req.params);
      validateBodyFromAuthentication(req.body);
      const accountStorage = await archiveService.getPayerAccountStorage(
        req.params.archiveId,
        req.body.emailFromAuthToken
      );
      res.json(accountStorage);
    } catch (err) {
      if (isValidationError(err)) {
        res.status(400).json({ error: err });
        return;
      }
      next(err);
    }
  }
);
