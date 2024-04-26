/** @format */

import {
  Router,
  type Response,
  type Request,
  type NextFunction,
} from "express";
import fetch from "node-fetch";
import { verifyUserAuthentication } from "../middleware";
import { isValidationError } from "../validators/validator_util";
import { logger } from "@stela/logger";

const fusionAuthUrl = process.env["FUSIONAUTH_HOST"] ?? "";

export const idpUserController = Router();

idpUserController.get(
  "/",
  verifyUserAuthentication,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info(req.body.emailFromAuthToken);
      const fusionAuthKey = process.env["FUSIONAUTH_API_KEY"] ?? "";
      const fusionAuthTenant = process.env["FUSIONAUTH_TENANT"] ?? "";
      const userUrl = fusionAuthUrl + '/api/user?email=' + req.body.emailFromAuthToken;
      logger.info(userUrl);
      // needs API key in auth header. JWT is deprecated!
      const response = await fetch(userUrl, {
        headers: {
          "Authentication": fusionAuthKey,
          "X-FusionAuth-TenantId": fusionAuthTenant,
        },
      });
      if (response.status == 200) {
        const userInfo = await response.json();
        logger.info(userInfo);
        res.send([userInfo]);
      } else {
        logger.info(response.status);
        res.send(response.status);
      }
    } catch (err) {
      if (isValidationError(err)) {
        res.status(400).json({ error: err });
        return;
      }
      next(err);
    }
  }
);
