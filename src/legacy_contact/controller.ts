import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { verifyUserAuthentication } from "../middleware";
import { validateCreateLegacyContactRequest } from "./validators";
import { isValidationError } from "../validator_util";
import { legacyContactService } from "./service";

export const legacyContactController = Router();
legacyContactController.post(
  "/",
  verifyUserAuthentication,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      validateCreateLegacyContactRequest(req.body);
    } catch (err) {
      if (isValidationError(err)) {
        res.status(400).json({ error: err });
        return;
      }
      next(err);
    }
    if (validateCreateLegacyContactRequest(req.body)) {
      try {
        const legacyContact = await legacyContactService.createLegacyContact(
          req.body
        );
        res.json(legacyContact);
      } catch (err) {
        next(err);
      }
    }
  }
);
