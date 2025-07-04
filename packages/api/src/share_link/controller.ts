import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import createError from "http-errors";
import {
	verifyUserAuthentication,
	extractUserEmailFromAuthToken,
} from "../middleware";
import {
	validateCreateShareLinkRequest,
	validateUpdateShareLinkRequest,
	validateGetShareLinksParameters,
} from "./validators";
import { isValidationError } from "../validators/validator_util";
import { shareLinkService } from "./service";
import { validateBodyFromAuthentication } from "../validators";
import { validateOptionalAuthenticationValues } from "../validators/shared";

export const shareLinkController = Router();

shareLinkController.post(
	"/",
	verifyUserAuthentication,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			validateCreateShareLinkRequest(req.body);
			const response = await shareLinkService.createShareLink(req.body);
			res.status(201).json({ data: response });
		} catch (err) {
			if (isValidationError(err)) {
				res.status(400).json({ error: err });
				return;
			}
			next(err);
		}
	},
);

shareLinkController.patch(
	"/:shareLinkId",
	verifyUserAuthentication,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			validateUpdateShareLinkRequest(req.body);
			const updatedShareLink = await shareLinkService.updateShareLink(
				req.params["shareLinkId"] ?? "",
				req.body,
			);
			res.status(200).json({ data: updatedShareLink });
		} catch (err) {
			if (isValidationError(err)) {
				res.status(400).json({ error: err });
				return;
			}
			next(err);
		}
	},
);

shareLinkController.get(
	"/",
	extractUserEmailFromAuthToken,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			validateOptionalAuthenticationValues(req.body);
			validateGetShareLinksParameters(req.query);
			if (
				req.query.shareLinkIds !== undefined &&
				req.body.emailFromAuthToken === undefined
			) {
				throw createError.Unauthorized(
					"Accessing share links by ID requires authentication",
				);
			}
			const shareLinks = await shareLinkService.getShareLinks(
				req.body.emailFromAuthToken,
				req.query.shareTokens,
				req.query.shareLinkIds,
			);
			res.status(200).json({ items: shareLinks });
		} catch (err) {
			if (isValidationError(err)) {
				res.status(400).json({ error: err });
				return;
			}
			next(err);
		}
	},
);

shareLinkController.delete(
	"/:shareLinkId",
	verifyUserAuthentication,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			validateBodyFromAuthentication(req.body);
			await shareLinkService.deleteShareLink(
				req.body.emailFromAuthToken,
				req.params["shareLinkId"] ?? "",
			);
			res.sendStatus(204);
		} catch (err) {
			if (isValidationError(err)) {
				res.status(400).json({ error: err });
				return;
			}
			next(err);
		}
	},
);
