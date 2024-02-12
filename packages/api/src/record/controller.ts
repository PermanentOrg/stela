import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { verifyUserAuthentication } from "../middleware";
import { validateGetRecordRequest } from "./validators";
import { isValidationError } from "../validators/validator_util";

export const recordController = Router();

recordController.get(
  "/get",
  verifyUserAuthentication,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      validateGetRecordRequest(req.body);
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
