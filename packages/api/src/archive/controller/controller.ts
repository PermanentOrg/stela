import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import {
	verifyUserAuthentication,
	verifyAdminAuthentication,
} from "../../middleware";
import {
	validateArchiveIdFromParams,
	validateBodyFromAuthentication,
} from "../validators";
import { isValidationError } from "../../validators/validator_util";
import { archiveService } from "../service";

export const archiveController = Router();
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
				res.status(400).json({ error: err });
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
			res.sendStatus(200);
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
			res.sendStatus(200);
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
			res.sendStatus(200);
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
				res.status(400).json({ error: err });
				return;
			}
			next(err);
		}
	},
);
