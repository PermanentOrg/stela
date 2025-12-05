import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { HTTP_STATUS } from "@pdc/http-status-codes";

import {
	extractIp,
	verifyUserAuthentication,
	verifyAdminAuthentication,
} from "../../middleware";
import { isValidationError } from "../../validators/validator_util";
import {
	validateUpdateTagsRequest,
	validateBodyFromAuthentication,
	validateLeaveArchiveParams,
	validateLeaveArchiveRequest,
	validateCreateStorageAdjustmentRequest,
	validateCreateStorageAdjustmentParams,
} from "../validators";
import { accountService, createStorageAdjustment } from "../service";
import type { LeaveArchiveRequest } from "../models";

export const accountController = Router();
accountController.put(
	"/tags",
	verifyUserAuthentication,
	async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			validateUpdateTagsRequest(req.body);
			await accountService.updateTags(req.body);
			res.json({});
		} catch (err) {
			if (isValidationError(err)) {
				res.status(HTTP_STATUS.CLIENT_ERROR.BAD_REQUEST).json({ error: err });
				return;
			}
			next(err);
		}
	},
);
accountController.get(
	"/signup",
	verifyUserAuthentication,
	async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			validateBodyFromAuthentication(req.body);
			const signupDetails = await accountService.getSignupDetails(
				req.body.emailFromAuthToken,
			);
			res.json(signupDetails);
		} catch (err) {
			if (isValidationError(err)) {
				res.status(HTTP_STATUS.CLIENT_ERROR.BAD_REQUEST).json({ error: err });
				return;
			}
			next(err);
		}
	},
);
accountController.delete(
	"/archive/:archiveId",
	verifyUserAuthentication,
	extractIp,
	async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			validateLeaveArchiveRequest(req.body);
			validateLeaveArchiveParams(req.params);

			const data: LeaveArchiveRequest = {
				...req.params,
				...req.body,
			};

			await accountService.leaveArchive(data);

			res.status(HTTP_STATUS.SUCCESSFUL.NO_CONTENT).send();
		} catch (err) {
			if (isValidationError(err)) {
				res.status(HTTP_STATUS.CLIENT_ERROR.BAD_REQUEST).json({ error: err });
				return;
			}
			next(err);
		}
	},
);
accountController.post(
	"/:accountId/storage-adjustments",
	verifyAdminAuthentication,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			validateCreateStorageAdjustmentRequest(req.body);
			validateCreateStorageAdjustmentParams(req.params);
			const result = await createStorageAdjustment(
				req.params.accountId,
				req.body,
			);

			res.status(HTTP_STATUS.SUCCESSFUL.OK).json(result);
		} catch (err) {
			if (isValidationError(err)) {
				res
					.status(HTTP_STATUS.CLIENT_ERROR.BAD_REQUEST)
					.json({ error: err.message });
				return;
			}
			next(err);
		}
	},
);
