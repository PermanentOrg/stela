import { Router } from "express";
import type { Request, Response, NextFunction } from "express";

import { extractIp, verifyUserAuthentication } from "../../middleware";
import { isValidationError } from "../../validators/validator_util";

import {
	validateUpdateTagsRequest,
	validateBodyFromAuthentication,
	validateLeaveArchiveParams,
	validateLeaveArchiveRequest,
} from "../validators";
import { accountService } from "../service";
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
				res.status(400).json({ error: err });
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
				res.status(400).json({ error: err });
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

			res.status(204).send();
		} catch (err) {
			if (isValidationError(err)) {
				res.status(400).json({ error: err });
				return;
			}
			next(err);
		}
	},
);
