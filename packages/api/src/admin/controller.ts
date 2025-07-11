import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { HTTP_STATUS } from "@pdc/http-status-codes";
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
				req.body.endTimestamp,
			);
			if (results.failedFolders.length > 0) {
				res
					.status(HTTP_STATUS.SERVER_ERROR.INTERNAL_SERVER_ERROR)
					.json(results);
			} else {
				res.json(results);
			}
		} catch (err) {
			if (isValidationError(err)) {
				res.status(HTTP_STATUS.CLIENT_ERROR.BAD_REQUEST).json({ error: err });
				return;
			}
			next(err);
		}
	},
);

adminController.post(
	"/account/set_null_subjects",
	verifyAdminAuthentication,
	async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			validateAccountSetNullSubjectsRequest(req.body);
			const response = await adminService.setNullAccountSubjects(
				req.body.accounts,
			);
			res.json(response);
		} catch (err) {
			if (isValidationError(err)) {
				res.status(HTTP_STATUS.CLIENT_ERROR.BAD_REQUEST).json({ error: err });
				return;
			}
			next(err);
		}
	},
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
			res.status(HTTP_STATUS.SUCCESSFUL.OK).json({});
		} catch (err) {
			next(err);
		}
	},
);

// This endpoint exists to clean up corrupt data caused by a bug in the folder deletion logic.
// It should be deleted once that cleanup is achieved.
adminController.post(
	"/folder/delete-orphaned-folders",
	verifyAdminAuthentication,
	async (_: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const response = await adminService.triggerOrphanedFolderDeletion();
			res.status(HTTP_STATUS.SUCCESSFUL.OK).json(response);
		} catch (err) {
			next(err);
		}
	},
);
