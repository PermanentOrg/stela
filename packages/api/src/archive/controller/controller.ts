import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { HTTP_STATUS } from "@pdc/http-status-codes";
import {
	verifyUserAuthentication,
	verifyAdminAuthentication,
	extractUserIsAdminFromAuthToken,
	extractUserEmailFromAuthToken,
	extractIp,
} from "../../middleware/index.js";
import {
	validateArchiveIdFromParams,
	validateSearchQuery,
	validatePatchArchiveBody,
	validateGetSharedFoldersQuery,
	validateCreateArchiveRequest,
} from "../validators.js";
import { archiveService } from "../service/index.js";
import {
	validateClientIp,
	validatePaginationParameters,
} from "../../validators/shared.js";
import { ArchiveType } from "../models.js";
import { validateUserAuthentication } from "../../validators/index.js";

export const archiveController = Router();

archiveController.post(
	"/",
	verifyUserAuthentication,
	extractIp,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const auth = req.metadata?.auth;
			validateUserAuthentication(auth);
			validateClientIp(req.metadata?.clientIp);
			validateCreateArchiveRequest(req.body);
			const archive = await archiveService.createArchive(
				{
					...req.body,
					type: req.body.type ?? ArchiveType.Person,
				},
				{
					email: auth.email,
					subject: auth.subject,
					ip: req.metadata.clientIp,
					userAgent: req.get("User-Agent"),
				},
			);
			res.status(HTTP_STATUS.SUCCESSFUL.CREATED).json({ data: archive });
		} catch (err) {
			next(err);
		}
	},
);

archiveController.get(
	"/",
	extractUserIsAdminFromAuthToken,
	extractUserEmailFromAuthToken,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			validateSearchQuery(req.query);
			const auth = req.metadata?.auth;
			const isAdmin = auth?.kind === "admin";
			const callerEmail = auth?.kind === "user" ? auth.email : undefined;
			if (
				req.query.callerMembershipRole !== undefined &&
				callerEmail === undefined
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
				isAdmin,
				callerEmail,
			);
			res.json(response);
		} catch (err) {
			next(err);
		}
	},
);

archiveController.patch(
	"/:archiveId",
	verifyUserAuthentication,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const auth = req.metadata?.auth;
			validateUserAuthentication(auth);
			validateArchiveIdFromParams(req.params);
			validatePatchArchiveBody(req.body);
			const archive = await archiveService.updateArchive(
				req.params.archiveId,
				req.body.milestoneSortOrder,
				auth.email,
			);
			res.json({ data: archive });
		} catch (err) {
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
			const auth = req.metadata?.auth;
			validateUserAuthentication(auth);
			validateArchiveIdFromParams(req.params);
			const accountStorage = await archiveService.getPayerAccountStorage(
				req.params.archiveId,
				auth.email,
			);
			res.json(accountStorage);
		} catch (err) {
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

archiveController.get(
	"/:archiveId",
	verifyUserAuthentication,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const auth = req.metadata?.auth;
			validateUserAuthentication(auth);
			validateArchiveIdFromParams(req.params);
			const archive = await archiveService.getArchive(
				req.params.archiveId,
				auth.email,
			);
			res.json({ data: archive });
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
			const auth = req.metadata?.auth;
			validateUserAuthentication(auth);
			validateArchiveIdFromParams(req.params);
			validateGetSharedFoldersQuery(req.query);
			const response = await archiveService.getSharedFolders(
				req.params.archiveId,
				auth.email,
				{
					pageSize: req.query.pageSize,
					cursor: req.query.cursor,
				},
			);
			res.json(response);
		} catch (err) {
			next(err);
		}
	},
);

archiveController.get(
	"/:archiveId/received-shares",
	verifyUserAuthentication,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const auth = req.metadata?.auth;
			validateUserAuthentication(auth);
			validateArchiveIdFromParams(req.params);
			validatePaginationParameters(req.query);
			const response = await archiveService.getReceivedShares(
				req.params.archiveId,
				auth.email,
				{
					pageSize: req.query.pageSize,
					cursor: req.query.cursor,
				},
			);
			res.json(response);
		} catch (err) {
			next(err);
		}
	},
);
