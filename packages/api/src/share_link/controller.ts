import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import createError from "http-errors";
import {
	verifyUserAuthentication,
	extractUserEmailFromAuthToken,
} from "../middleware/index.js";
import {
	validateCreateShareLinkRequest,
	validateUpdateShareLinkRequest,
	validateGetShareLinksParameters,
	validateShareLinkParameters,
} from "./validators.js";
import { shareLinkService } from "./service.js";
import {
	validateOptionalAuthentication,
	validateUserAuthentication,
} from "../validators/index.js";
import { HTTP_STATUS } from "@pdc/http-status-codes";

export const shareLinkController = Router();

shareLinkController.post(
	"/",
	verifyUserAuthentication,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const auth = req.metadata?.auth;
			validateUserAuthentication(auth);
			validateCreateShareLinkRequest(req.body);
			const response = await shareLinkService.createShareLink(
				auth.email,
				req.body,
			);
			res.status(HTTP_STATUS.SUCCESSFUL.CREATED).json({ data: response });
		} catch (err) {
			next(err);
		}
	},
);

shareLinkController.patch(
	"/:shareLinkId",
	verifyUserAuthentication,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const auth = req.metadata?.auth;
			validateUserAuthentication(auth);
			validateUpdateShareLinkRequest(req.body);
			validateShareLinkParameters(req.params);
			const updatedShareLink = await shareLinkService.updateShareLink(
				req.params.shareLinkId,
				auth.email,
				req.body,
			);
			res.status(HTTP_STATUS.SUCCESSFUL.OK).json({ data: updatedShareLink });
		} catch (err) {
			next(err);
		}
	},
);

shareLinkController.get(
	"/",
	extractUserEmailFromAuthToken,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const auth = req.metadata?.auth ?? {};
			validateOptionalAuthentication(auth);
			validateGetShareLinksParameters(req.query);
			if (req.query.shareLinkIds !== undefined && auth.email === undefined) {
				throw createError.Unauthorized(
					"Accessing share links by ID requires authentication",
				);
			}
			const response = await shareLinkService.getShareLinks(
				auth.email,
				req.query.shareTokens,
				req.query.shareLinkIds,
				{
					pageSize: req.query.pageSize,
					cursor: req.query.cursor,
				},
			);
			res.status(HTTP_STATUS.SUCCESSFUL.OK).json(response);
		} catch (err) {
			next(err);
		}
	},
);

shareLinkController.delete(
	"/:shareLinkId",
	verifyUserAuthentication,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const auth = req.metadata?.auth;
			validateUserAuthentication(auth);
			validateShareLinkParameters(req.params);
			await shareLinkService.deleteShareLink(
				auth.email,
				req.params.shareLinkId,
			);
			res.sendStatus(HTTP_STATUS.SUCCESSFUL.NO_CONTENT);
		} catch (err) {
			next(err);
		}
	},
);
