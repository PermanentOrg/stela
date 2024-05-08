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
import { validateBodyFromAuthentication } from "../validators";
import type { TwoFactorRequestResponse } from "./models";

export const idpUserController = Router();

idpUserController.get(
  "/",
  verifyUserAuthentication,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      validateBodyFromAuthentication(req.body);
      let response: TwoFactorRequestResponse[] = [];
      const clientResponse = await fusionAuthClient.retrieveUserByEmail(
        req.body.emailFromAuthToken
      );
      if (clientResponse.response.user.twoFactor.methods.length) {
        response = clientResponse.response.user.twoFactor.methods.map(
          ({ id, method, email, mobilePhone }) => ({
            methodId: id,
            method,
            value: email || mobilePhone,
          })
        );
      }

      res.send(response);
    } catch (err) {
      if (isValidationError(err)) {
        res.status(400).json({ error: err });
        return;
      }
      next(err);
    }
  }
);
