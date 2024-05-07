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

export const idpUserController = Router();

idpUserController.get(
  "/",
  verifyUserAuthentication,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let response;
      const clientResponse = await fusionAuthClient.retrieveUserByEmail(req.body.emailFromAuthToken);
      response = clientResponse.response.user?.twoFactor?.methods ?? [];
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
