import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { HTTP_STATUS } from "@pdc/http-status-codes";
import { extractIp, verifyUserAuthentication } from "../middleware/index.js";
import {
	validateUpdateArchiveMembershipRequest,
	validateDeleteArchiveMembershipRequest,
	validateArchiveMembershipIdParams,
} from "./validators.js";
import { archiveMembershipService } from "./service.js";
import {
	validateClientIp,
	validateUserAuthentication,
} from "../validators/index.js";

export const archiveMembershipController = Router();

archiveMembershipController.patch(
	"/:id",
	verifyUserAuthentication,
	extractIp,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const auth = req.metadata?.auth;
			validateUserAuthentication(auth);
			validateUpdateArchiveMembershipRequest(req.body);
			validateArchiveMembershipIdParams(req.params);
			const ip = req.metadata?.clientIp;
			validateClientIp(ip);
			const updatedMembership =
				await archiveMembershipService.updateArchiveMembership(
					req.params.id,
					req.body,
					{
						email: auth.email,
						subject: auth.subject,
						ip,
						userAgent: req.headers["user-agent"],
					},
				);
			res.status(HTTP_STATUS.SUCCESSFUL.OK).json({ data: updatedMembership });
		} catch (err) {
			next(err);
		}
	},
);

archiveMembershipController.delete(
	"/:id",
	verifyUserAuthentication,
	extractIp,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const auth = req.metadata?.auth;
			validateUserAuthentication(auth);
			validateDeleteArchiveMembershipRequest(req.body);
			validateArchiveMembershipIdParams(req.params);
			const ip = req.metadata?.clientIp;
			validateClientIp(ip);
			await archiveMembershipService.deleteArchiveMembership(req.params.id, {
				email: auth.email,
				subject: auth.subject,
				ip,
				userAgent: req.headers["user-agent"],
			});
			res.status(HTTP_STATUS.SUCCESSFUL.NO_CONTENT).send();
		} catch (err) {
			next(err);
		}
	},
);
