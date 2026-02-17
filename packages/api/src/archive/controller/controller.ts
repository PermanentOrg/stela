import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import {
	verifyUserAuthentication,
	verifyAdminAuthentication,
	extractUserIsAdminFromAuthToken,
	extractUserEmailFromAuthToken,
} from "../../middleware";
import {
	validateArchiveIdFromParams,
	validateBodyFromAuthentication,
	validateSearchQuery,
	validatePatchArchiveBody,
} from "../validators";
import { isValidationError } from "../../validators/validator_util";
import { archiveService } from "../service";
import { HTTP_STATUS } from "@pdc/http-status-codes";

export const archiveController = Router();

archiveController.get(
	"/",
	extractUserIsAdminFromAuthToken,
	extractUserEmailFromAuthToken,
	async (
		req: Request<
			unknown,
			unknown,
			{ admin?: boolean; emailFromAuthToken?: string }
		>,
		res: Response,
		next: NextFunction,
	) => {
		try {
			validateSearchQuery(req.query);
			if (
				req.query.callerMembershipRole !== undefined &&
				req.body.emailFromAuthToken === undefined
			) {
				res.status(HTTP_STATUS.CLIENT_ERROR.UNAUTHORIZED).json({
					error: "Authentication required for callerMembershipRole filter",
				});
				return;
			}
			const response = await archiveService.searchArchives(
				{
					searchQuery: req.query.searchQuery,
					callerMembershipRole: req.query.callerMembershipRole,
				},
				{
					pageSize: req.query.pageSize,
					cursor: req.query.cursor,
				},
				req.body.admin ?? false,
				req.body.emailFromAuthToken,
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

archiveController.patch(
	"/:archiveId",
	verifyUserAuthentication,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			validateArchiveIdFromParams(req.params);
			validatePatchArchiveBody(req.body);
			const archive = await archiveService.updateArchive(
				req.params.archiveId,
				req.body.milestoneSortOrder,
				req.body.emailFromAuthToken,
			);
			res.json({ data: archive });
		} catch (err) {
			if (isValidationError(err)) {
				res.status(HTTP_STATUS.CLIENT_ERROR.BAD_REQUEST).json({ error: err });
				return;
			}
			next(err);
		}
	},
);

archiveController.get(
	"/:archiveId/tags/public",
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			validateArchiveIdFromParams(req.params);
			const tags = await archiveService.getPublicTags(req.params.archiveId);
			res.json(tags);
		} catch (err) {
			next(err);
		}
	},
);

archiveController.get(
	"/:archiveId/payer-account-storage",
	verifyUserAuthentication,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			validateArchiveIdFromParams(req.params);
			validateBodyFromAuthentication(req.body);
			const accountStorage = await archiveService.getPayerAccountStorage(
				req.params.archiveId,
				req.body.emailFromAuthToken,
			);
			res.json(accountStorage);
		} catch (err) {
			if (isValidationError(err)) {
				res.status(HTTP_STATUS.CLIENT_ERROR.BAD_REQUEST).json({ error: err });
				return;
			}
			next(err);
		}
	},
);

archiveController.post(
	"/:archiveId/make-featured",
	verifyAdminAuthentication,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			validateArchiveIdFromParams(req.params);
			await archiveService.makeFeatured(req.params.archiveId);
			res.sendStatus(HTTP_STATUS.SUCCESSFUL.OK);
		} catch (err) {
			next(err);
		}
	},
);

archiveController.delete(
	"/:archiveId/unfeature",
	verifyAdminAuthentication,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			validateArchiveIdFromParams(req.params);
			await archiveService.unfeature(req.params.archiveId);
			res.sendStatus(HTTP_STATUS.SUCCESSFUL.OK);
		} catch (err) {
			next(err);
		}
	},
);

archiveController.get(
	"/featured",
	async (_: Request, res: Response, next: NextFunction) => {
		try {
			const archives = await archiveService.getFeatured();
			res.json(archives);
		} catch (err) {
			next(err);
		}
	},
);

archiveController.post(
	"/:archiveId/backfill-ledger",
	verifyAdminAuthentication,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			validateArchiveIdFromParams(req.params);
			await archiveService.backfillLedger(req.params.archiveId);
			res.sendStatus(HTTP_STATUS.SUCCESSFUL.OK);
		} catch (err) {
			next(err);
		}
	},
);

archiveController.get(
	"/:archiveId/folders/shared",
	verifyUserAuthentication,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			validateArchiveIdFromParams(req.params);
			validateBodyFromAuthentication(req.body);
			const folders = await archiveService.getSharedFolders(
				req.params.archiveId,
				req.body.emailFromAuthToken,
			);
			res.json({ items: folders });
		} catch (err) {
			if (isValidationError(err)) {
				res.status(HTTP_STATUS.CLIENT_ERROR.BAD_REQUEST).json({ error: err });
				return;
			}
			next(err);
		}
	},
);
