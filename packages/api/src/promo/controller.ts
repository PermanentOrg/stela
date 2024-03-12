import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { verifyAdminAuthentication } from "../middleware/authentication";
import { validateCreatePromoRequest } from "./validators";
import { isValidationError } from "../validators/validator_util";
import { createPromo } from "./service";

export const promoController = Router();

promoController.post(
  "/",
  verifyAdminAuthentication,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      validateCreatePromoRequest(req.body);
      await createPromo(req.body);
      res.status(200).send({});
    } catch (err) {
      if (isValidationError(err)) {
        res.status(400).json({ error: err.message });
        return;
      }
      next(err);
    }
  }
);
