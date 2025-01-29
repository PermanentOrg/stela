import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { verifyUserAuthentication } from "../middleware";
import { validateCreateShareLinkRequest } from "./validators";
import { isValidationError } from "../validators/validator_util";
import { shareLinkService } from "./service";

export const shareLinkController = Router();

shareLinkController.post(
  "/",
  verifyUserAuthentication,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      validateCreateShareLinkRequest(req.body);
      const response = await shareLinkService.createShareLink(req.body);
      res.status(201).json({ data: response });
    } catch (err) {
      if (isValidationError(err)) {
        res.status(400).json({ error: err });
        return;
      }
      next(err);
    }
  }
);
