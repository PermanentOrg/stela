import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { verifyUserAuthentication } from "../middleware";
import {
  validateCreateLegacyContactRequest,
  validateBodyFromAuthentication,
} from "./validators";
import { isValidationError } from "../validators/validator_util";
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

legacyContactController.get(
  "/",
  verifyUserAuthentication,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      validateBodyFromAuthentication(req.body);
    } catch (err) {
      if (isValidationError(err)) {
        res.status(400).json({ error: err });
        return;
      }
      next(err);
    }
    if (validateBodyFromAuthentication(req.body)) {
      try {
        const legacyContacts =
          await legacyContactService.getLegacyContactsByAccountId(
            req.body.emailFromAuthToken
          );
        res.json(legacyContacts);
      } catch (err) {
        next(err);
      }
    }
  }
);
