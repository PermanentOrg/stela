import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { HTTP_STATUS } from "@pdc/http-status-codes";

import {
	extractIp,
	verifyUserAuthentication,
	verifyAdminAuthentication,
} from "../../middleware/index.js";
import {
	validateUpdateTagsRequest,
	validatePostMarketingTagsRequest,
	validateLeaveArchiveParams,
	validateCreateStorageAdjustmentRequest,
	validateCreateStorageAdjustmentParams,
	validateGetAccountsQuery,
} from "../validators.js";
import {
	accountService,
	createStorageAdjustment,
	getAccounts,
} from "../service.js";
import { claimPromo } from "../../promo/service.js";
import { validateClaimPromoRequest } from "../../promo/validators.js";
import {
	validateAdminAuthentication,
	validateClientIp,
	validateUserAuthentication,
} from "../../validators/index.js";

export const accountController = Router();
accountController.get(
	"/",
	verifyAdminAuthentication,
	async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			validateAdminAuthentication(req.metadata?.auth);
			validateGetAccountsQuery(req.query);
			const result = await getAccounts(req.query);
			res.status(HTTP_STATUS.SUCCESSFUL.OK).json(result);
		} catch (err) {
			next(err);
		}
	},
);
accountController.put(
	"/tags",
	verifyUserAuthentication,
	async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const auth = req.metadata?.auth;
			validateUserAuthentication(auth);
			validateUpdateTagsRequest(req.body);
			await accountService.updateTags(auth.email, req.body);
			res.json({});
		} catch (err) {
			next(err);
		}
	},
);
accountController.get(
	"/me/marketing-tags",
	verifyUserAuthentication,
	async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const auth = req.metadata?.auth;
			validateUserAuthentication(auth);
			const result = await accountService.getMarketingTags(auth.email);
			res.status(HTTP_STATUS.SUCCESSFUL.OK).json(result);
		} catch (err) {
			next(err);
		}
	},
);
accountController.get(
	"/signup",
	verifyUserAuthentication,
	async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const auth = req.metadata?.auth;
			validateUserAuthentication(auth);
			const signupDetails = await accountService.getSignupDetails(auth.email);
			res.json(signupDetails);
		} catch (err) {
			next(err);
		}
	},
);
accountController.get(
	"/me",
	verifyUserAuthentication,
	async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const auth = req.metadata?.auth;
			validateUserAuthentication(auth);
			const account = await accountService.getMe(auth.email);
			res.status(HTTP_STATUS.SUCCESSFUL.OK).json({ data: account });
		} catch (err) {
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
			const auth = req.metadata?.auth;
			validateUserAuthentication(auth);
			const clientIp = req.metadata?.clientIp;
			validateClientIp(clientIp);
			validateLeaveArchiveParams(req.params);

			await accountService.leaveArchive({
				archiveId: req.params.archiveId,
				emailFromAuthToken: auth.email,
				userSubjectFromAuthToken: auth.subject,
				ip: clientIp,
			});

			res.status(HTTP_STATUS.SUCCESSFUL.NO_CONTENT).send();
		} catch (err) {
			next(err);
		}
	},
);
accountController.post(
	"/me/marketing-tags",
	verifyUserAuthentication,
	async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const auth = req.metadata?.auth;
			validateUserAuthentication(auth);
			validatePostMarketingTagsRequest(req.body);
			const result = await accountService.postMarketingTags(
				auth.email,
				req.body,
			);
			res.json(result);
		} catch (err) {
			next(err);
		}
	},
);
accountController.post(
	"/me/promo-claim",
	verifyUserAuthentication,
	async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const auth = req.metadata?.auth;
			validateUserAuthentication(auth);
			validateClaimPromoRequest(req.body);
			const result = await claimPromo(auth.email, req.body);
			res.status(HTTP_STATUS.SUCCESSFUL.OK).json({ data: result });
		} catch (err) {
			next(err);
		}
	},
);
accountController.post(
	"/:accountId/storage-adjustments",
	verifyAdminAuthentication,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			validateAdminAuthentication(req.metadata?.auth);
			validateCreateStorageAdjustmentRequest(req.body);
			validateCreateStorageAdjustmentParams(req.params);
			const result = await createStorageAdjustment(
				req.params.accountId,
				req.body,
			);

			res.status(HTTP_STATUS.SUCCESSFUL.OK).json(result);
		} catch (err) {
			next(err);
		}
	},
);
