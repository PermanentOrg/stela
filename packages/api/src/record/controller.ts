import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { extractUserEmailFromAuthToken } from "../middleware";
import { getRecordById } from "./service";
import { validateGetRecordQuery } from "./validators";
import { validateOptionalEmailFromAuthentication } from "../validators/shared";
import { isValidationError } from "../validators/validator_util";

export const recordController = Router();

recordController.get(
  "/",
  extractUserEmailFromAuthToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      validateOptionalEmailFromAuthentication(req.body);
      validateGetRecordQuery(req.query);
      const records = await getRecordById({
        recordIds: req.query.recordIds,
        accountEmail: req.body.emailFromAuthToken,
      });
      res.send(records);
    } catch (error) {
      if (isValidationError(error)) {
        res.status(400).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);
