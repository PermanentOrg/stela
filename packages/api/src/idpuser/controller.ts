/** @format */

import {
  Router,
  type Response,
  type Request,
  type NextFunction,
} from "express";
import fetch from "node-fetch";
import { verifyUserAuthentication } from "../middleware";
import { validateTokenFromBody } from "./validators";
import { isValidationError } from "../validators/validator_util";
import { logger } from "@stela/logger";

const hostUrl = process.env["FUSIONAUTH_HOST"] ?? "";

export const idpUserController = Router();

idpUserController.get(
  "/",
  verifyUserAuthentication,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info(req.body)
      validateTokenFromBody(req.body);

      const response = await fetch(`${hostUrl}/api/user`, {
        headers: {},
      });
      res.send([response]);
    } catch (error) {
      if (isValidationError(error)) {
        res.status(400).json({ error });
        return;
      }
      next(error);
    }
  }
);
