import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import {
  extractUserEmailFromAuthToken,
  verifyUserAuthentication,
} from "../middleware";
import { getRecordById, patchRecord } from "./service";
import {
  validateGetRecordQuery,
  validatePatchRecordRequest,
  validateRecordRequest,
} from "./validators";
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

recordController.patch(
  "/:recordId",
  verifyUserAuthentication,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      validateRecordRequest(req.params);
      validatePatchRecordRequest(req.body);
      const recordId = await patchRecord(req.params.recordId, req.body);
      const record = await getRecordById({
        recordIds: [recordId],
        accountEmail: req.body.emailFromAuthToken,
      });

      res.status(200).send({ data: record });
    } catch (err) {
      if (isValidationError(err)) {
        res.status(400).json({ error: err.message });
        return;
      }
      next(err);
    }
  }
);
