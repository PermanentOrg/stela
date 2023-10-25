import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { verifyUserAuthentication } from "../middleware";
import { validateGiftStorageRequest } from "./validators";
import { isValidationError } from "../validators/validator_util";
import { issueGift } from "./service";

export const billingController = Router();

billingController.post(
  "/gift",
  verifyUserAuthentication,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      validateGiftStorageRequest(req.body);
      const result = await issueGift(req.body);

      res.status(200).json(result);
    } catch (err) {
      if (isValidationError(err)) {
        res.status(400).json({ error: err.message });
        return;
      }
      next(err);
    }
  }
);
