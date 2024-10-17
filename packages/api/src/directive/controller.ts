import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { directiveService } from "./service";
import {
  verifyUserAuthentication,
  verifyAdminAuthentication,
} from "../middleware";
import {
  validateUpdateDirectiveParams,
  validateUpdateDirectiveRequest,
  validateCreateDirectiveRequest,
  validateTriggerAdminDirectivesParams,
  validateGetDirectivesByArchiveIdParams,
  validateBodyFromAuthentication,
} from "./validators";
import { validateBodyFromAdminAuthentication } from "../validators";
import { isValidationError } from "../validators/validator_util";

export const directiveController = Router();
directiveController.post(
  "/",
  verifyUserAuthentication,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      validateCreateDirectiveRequest(req.body);
      const directive = await directiveService.createDirective(req.body);
      res.json(directive);
    } catch (err) {
      if (isValidationError(err)) {
        res.status(400).json({ error: err });
        return;
      }
      next(err);
    }
  }
);

directiveController.put(
  "/:directiveId",
  verifyUserAuthentication,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      validateUpdateDirectiveRequest(req.body);
      validateUpdateDirectiveParams(req.params);
      const directive = await directiveService.updateDirective(
        req.params.directiveId,
        req.body
      );
      res.json(directive);
    } catch (err) {
      if (isValidationError(err)) {
        res.status(400).json({ error: err });
        return;
      }
      next(err);
    }
  }
);

directiveController.post(
  "/trigger/account/:accountId",
  verifyAdminAuthentication,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      validateTriggerAdminDirectivesParams(req.params);
      validateBodyFromAdminAuthentication(req.body);
      const responseBody = await directiveService.triggerAccountAdminDirectives(
        req.params.accountId
      );
      res.json(responseBody);
    } catch (err) {
      if (isValidationError(err)) {
        res.status(400).json({ error: err });
        return;
      }
      next(err);
    }
  }
);

directiveController.get(
  "/archive/:archiveId",
  verifyUserAuthentication,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      validateGetDirectivesByArchiveIdParams(req.params);
      validateBodyFromAuthentication(req.body);
      const responseBody = await directiveService.getDirectivesByArchiveId(
        req.params.archiveId,
        req.body.emailFromAuthToken
      );
      res.json(responseBody);
    } catch (err) {
      if (isValidationError(err)) {
        res.status(400).json({ error: err });
        return;
      }
      next(err);
    }
  }
);
