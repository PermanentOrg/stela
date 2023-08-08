import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { adminService } from "./service";
import { verifyAdminAuthentication } from "../middleware";
import { validateRecalculateFolderThumbnailsRequest } from "./validators";
import { isValidationError } from "../validators/validator_util";
import { logger } from "../log";

export const adminController = Router();
adminController.post(
  "/folder/recalculate_thumbnails",
  verifyAdminAuthentication,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      logger.info("In recalculate_thumbnails");
      validateRecalculateFolderThumbnailsRequest(req.body);
      logger.info("Validated recalculate_thumbnails request");
      const results = await adminService.recalculateFolderThumbnails(
        req.body.cutoffTimestamp
      );
      logger.info("Finished recalculate_thumbnails");
      if (results.failedFolders.length > 0) {
        res.status(500).json(results);
      } else {
        res.json(results);
      }
    } catch (err) {
      logger.error("Error in recalculate_thumbnails", err);
      if (isValidationError(err)) {
        res.status(400).json({ error: err });
        return;
      }
      next(err);
    }
  }
);
