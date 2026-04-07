import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import {
	verifyUserAuthentication,
	verifyUserOrAdminOrDelegatedCallAuthentication,
	extractIp,
} from "../middleware";
import { validateCreateEventRequest } from "./validators";
import { validateBodyFromAuthentication } from "../validators/shared";
import { createEvent, getChecklistEvents } from "./service";
import { HTTP_STATUS } from "@pdc/http-status-codes";

export const eventController = Router();

eventController.post(
	"/",
	verifyUserOrAdminOrDelegatedCallAuthentication,
	extractIp,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			validateCreateEventRequest(req.body);
			const userAgent = req.body.userAgent ?? req.headers["user-agent"];
			if (userAgent !== undefined) {
				req.body.userAgent = userAgent;
			}
			await createEvent(req.body);
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
			validateBodyFromAuthentication(req.body);
			const response = await getChecklistEvents(req.body.emailFromAuthToken);
			res.status(HTTP_STATUS.SUCCESSFUL.OK).json({ checklistItems: response });
		} catch (err) {
			next(err);
		}
	},
);
