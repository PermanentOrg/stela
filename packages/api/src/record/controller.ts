import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { verifyUserAuthentication } from "../middleware";
import { validateGetRecordQuery } from "./validators";
import { validateBodyFromAuthentication } from "../validators/shared";
import { isValidationError } from "../validators/validator_util";

export const recordController = Router();

recordController.get(
  "/get",
  verifyUserAuthentication,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      validateBodyFromAuthentication(req.body);
      validateGetRecordQuery(req.query);
      res.send("Hello, World!");
    } catch (error) {
      if (isValidationError(error)) {
        res.status(400).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);
