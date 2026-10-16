import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import {
	verifyUserAuthentication,
	verifyUserOrAdminOrDelegatedCallAuthentication,
	extractIp,
} from "../middleware/index.js";
import { validateCreateEventRequest } from "./validators.js";
import {
	validateClientIp,
	validateUserAuthentication,
	validateUserOrAdminAuthentication,
} from "../validators/index.js";
import { createEvent, getChecklistEvents } from "./service.js";
import { HTTP_STATUS } from "@pdc/http-status-codes";

export const eventController = Router();

eventController.post(
	"/",
	verifyUserOrAdminOrDelegatedCallAuthentication,
	extractIp,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const auth = req.metadata?.auth;
			validateUserOrAdminAuthentication(auth);
			const clientIp = req.metadata?.clientIp;
			validateClientIp(clientIp);
			validateCreateEventRequest(req.body);
			await createEvent({
				...req.body,
				...(auth.kind === "user"
					? {
							userSubjectFromAuthToken: auth.subject,
							userEmailFromAuthToken: auth.email,
						}
					: {
							adminSubjectFromAuthToken: auth.subject,
							adminEmailFromAuthToken: auth.email,
						}),
				ip: clientIp,
				userAgent: req.body.userAgent ?? req.headers["user-agent"],
			});
			res.status(HTTP_STATUS.SUCCESSFUL.OK).json({});
		} catch (err) {
			next(err);
		}
	},
);

eventController.get(
	"/checklist",
	verifyUserAuthentication,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const auth = req.metadata?.auth;
			validateUserAuthentication(auth);
			const response = await getChecklistEvents(auth.email);
			res.status(HTTP_STATUS.SUCCESSFUL.OK).json({ checklistItems: response });
		} catch (err) {
			next(err);
		}
	},
);
