import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { directiveService } from "./service";
import { verifyUserAuthentication } from "../middleware";
import { validateCreateDirectiveRequest } from "./validators";
import { isValidationError } from "../validator_util";

export const directiveController = Router();
directiveController.use(verifyUserAuthentication);
directiveController.post(
  "/",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      validateCreateDirectiveRequest(req.body);
    } catch (err) {
      if (isValidationError(err)) {
        res.status(400).json({ error: err });
        return;
      }
      next(err);
    }
    if (validateCreateDirectiveRequest(req.body)) {
      try {
        const directive = await directiveService.createDirective(req.body);
        res.json(directive);
      } catch (err) {
        next(err);
      }
    }
  }
);
