/** @format */

import {
  Router,
  type Response,
  type Request,
  type NextFunction,
} from "express";
import { verifyUserAuthentication } from "../middleware";
import { validateTokenFromBody } from "./validators";
import { isValidationError } from "../validators/validator_util";

export const idpUserController = Router();

idpUserController.get(
  "/",
  verifyUserAuthentication,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      validateTokenFromBody(req.body);
      res.send([]);
    } catch (error) {
      if (isValidationError(error)) {
        res.status(400).json({ error });
        return;
      }
      next(error);
    }
  }
);
