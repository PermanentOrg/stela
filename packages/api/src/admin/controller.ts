import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { adminService } from "./service";
import { verifyAdminAuthentication } from "../middleware";
import {
  validateRecalculateFolderThumbnailsRequest,
  validateRecalculateRecordThumbnailRequest,
  validateAccountSetNullSubjectsRequest,
} from "./validators";
import { isValidationError } from "../validators/validator_util";

export const adminController = Router();
adminController.post(
  "/folder/recalculate_thumbnails",
  verifyAdminAuthentication,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      validateRecalculateFolderThumbnailsRequest(req.body);
      const results = await adminService.recalculateFolderThumbnails(
        req.body.beginTimestamp,
        req.body.endTimestamp
      );
      if (results.failedFolders.length > 0) {
        res.status(500).json(results);
      } else {
        res.json(results);
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

adminController.post(
  "/account/set_null_subjects",
  verifyAdminAuthentication,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      validateAccountSetNullSubjectsRequest(req.body);
      const response = await adminService.setNullAccountSubjects(
        req.body.accounts
      );
      res.json(response);
    } catch (err) {
      if (isValidationError(err)) {
        res.status(400).json({ error: err });
        return;
      }
      next(err);
    }
  }
);

adminController.post(
  "/record/:recordId/recalculate_thumbnail",
  verifyAdminAuthentication,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // You couldn't actually call this endpoint with invalid params,
      // because the route would not match. We validate solely to make the type checker happy.
      // This is why there is no error handling for validation errors.
      validateRecalculateRecordThumbnailRequest(req.params);
      await adminService.recalculateRecordThumbnail(req.params.recordId);
      res.status(200).json({});
    } catch (err) {
      next(err);
    }
  }
);

// This endpoint exists to clean up corrupt data caused by a bug in the folder deletion logic.
// It should be deleted once that cleanup is achieved.
adminController.post(
  "/folder/delete-orphaned-folders",
  verifyAdminAuthentication,
  async (_: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const response = await adminService.triggerOrphanedFolderDeletion();
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }
);
