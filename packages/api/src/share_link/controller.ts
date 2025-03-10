import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { verifyUserAuthentication } from "../middleware";
import {
  validateCreateShareLinkRequest,
  validateUpdateShareLinkRequest,
} from "./validators";
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

shareLinkController.patch(
  "/:shareLinkId",
  verifyUserAuthentication,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      validateUpdateShareLinkRequest(req.body);
      const updatedShareLink = await shareLinkService.updateShareLink(
        req.params["shareLinkId"] ?? "",
        req.body
      );
      res.status(200).json({ data: updatedShareLink });
    } catch (err) {
      if (isValidationError(err)) {
        res.status(400).json({ error: err });
        return;
      }
      next(err);
    }
  }
);
