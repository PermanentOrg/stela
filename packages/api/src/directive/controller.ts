import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { directiveService } from "./service/index.js";
import {
	verifyUserAuthentication,
	verifyAdminAuthentication,
} from "../middleware/index.js";
import {
	validateUpdateDirectiveParams,
	validateUpdateDirectiveRequest,
	validateCreateDirectiveRequest,
	validateTriggerAdminDirectivesParams,
	validateGetDirectivesByArchiveIdParams,
} from "./validators.js";
import {
	validateAdminAuthentication,
	validateUserAuthentication,
} from "../validators/index.js";

export const directiveController = Router();
directiveController.post(
	"/",
	verifyUserAuthentication,
	async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const auth = req.metadata?.auth;
			validateUserAuthentication(auth);
			validateCreateDirectiveRequest(req.body, auth.email);
			const directive = await directiveService.createDirective(
				auth.email,
				req.body,
			);
			res.json(directive);
		} catch (err) {
			next(err);
		}
	},
);

directiveController.put(
	"/:directiveId",
	verifyUserAuthentication,
	async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const auth = req.metadata?.auth;
			validateUserAuthentication(auth);
			validateUpdateDirectiveRequest(req.body, auth.email);
			validateUpdateDirectiveParams(req.params);
			const directive = await directiveService.updateDirective(
				req.params.directiveId,
				auth.email,
				req.body,
			);
			res.json(directive);
		} catch (err) {
			next(err);
		}
	},
);

directiveController.post(
	"/trigger/account/:accountId",
	verifyAdminAuthentication,
	async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			validateAdminAuthentication(req.metadata?.auth);
			validateTriggerAdminDirectivesParams(req.params);
			const responseBody = await directiveService.triggerAccountAdminDirectives(
				req.params.accountId,
			);
			res.json(responseBody);
		} catch (err) {
			next(err);
		}
	},
);

directiveController.get(
	"/archive/:archiveId",
	verifyUserAuthentication,
	async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const auth = req.metadata?.auth;
			validateUserAuthentication(auth);
			validateGetDirectivesByArchiveIdParams(req.params);
			const responseBody = await directiveService.getDirectivesByArchiveId(
				req.params.archiveId,
				auth.email,
			);
			res.json(responseBody);
		} catch (err) {
			next(err);
		}
	},
);
