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

export const archiveMembershipController = Router();

archiveMembershipController.patch(
	"/:id",
	verifyUserAuthentication,
	extractIp,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			validateUpdateArchiveMembershipRequest(req.body);
			validateArchiveMembershipIdParams(req.params);
			const {
				headers: { "user-agent": userAgent },
			} = req;
			req.body.userAgent = userAgent;
			const updatedMembership =
				await archiveMembershipService.updateArchiveMembership(
					req.params.id,
					req.body,
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
			validateDeleteArchiveMembershipRequest(req.body);
			validateArchiveMembershipIdParams(req.params);
			const {
				headers: { "user-agent": userAgent },
			} = req;
			req.body.userAgent = userAgent;
			await archiveMembershipService.deleteArchiveMembership(
				req.params.id,
				req.body,
			);
			res.status(HTTP_STATUS.SUCCESSFUL.NO_CONTENT).send();
		} catch (err) {
			next(err);
		}
	},
);
