import {
  Router,
  type Response,
  type Request,
  type NextFunction,
} from "express";
import { verifyUserAuthentication } from "../middleware";
import { isValidationError } from "../validators/validator_util";
import { validateBodyFromAuthentication } from "../validators";
import { validateSendEnableCodeRequest } from "./validators";
import { getTwoFactorMethods, sendEnableCode } from "./service";

export const idpUserController = Router();

idpUserController.get(
  "/",
  verifyUserAuthentication,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      validateBodyFromAuthentication(req.body);
      const response = await getTwoFactorMethods(req.body.emailFromAuthToken);

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

idpUserController.post(
  "/send-enable-code",
  verifyUserAuthentication,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      validateSendEnableCodeRequest(req.body);
      await sendEnableCode(req.body);
      res.send(200);
    } catch (err) {
      if (isValidationError(err)) {
        res.status(400).json({ error: err });
        return;
      }
      next(err);
    }
  }
);
