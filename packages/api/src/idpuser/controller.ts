/** @format */

import {
  Router,
  type Response,
  type Request,
  type NextFunction,
} from "express";
import { fusionAuthClient } from "../fusionauth";
import { verifyUserAuthentication } from "../middleware";
import { isValidationError } from "../validators/validator_util";
import { logger } from "@stela/logger";

export const idpUserController = Router();

idpUserController.get(
  "/",
  verifyUserAuthentication,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info(req.body.emailFromAuthToken);
      fusionAuthClient.retrieveUserByEmail('madeup@example.com')
        .then(clientResponse => {
          let methods = JSON.stringify(clientResponse.response.user) ?? [];
          res.send(methods);
        })
        .catch(console.error);
    } catch (err) {
      if (isValidationError(err)) {
        res.status(400).json({ error: err });
        return;
      }
      next(err);
    }
  }
);
