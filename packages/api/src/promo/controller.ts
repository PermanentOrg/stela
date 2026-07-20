import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { verifyAdminAuthentication } from "../middleware/authentication.js";
import { validateCreatePromoRequest } from "./validators.js";
import { createPromo, getPromos } from "./service.js";
import { HTTP_STATUS } from "@pdc/http-status-codes";

export const promoController = Router();

promoController.post(
	"/",
	verifyAdminAuthentication,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			validateCreatePromoRequest(req.body);
			await createPromo(req.body);
			res.status(HTTP_STATUS.SUCCESSFUL.OK).send({});
		} catch (err) {
			next(err);
		}
	},
);

promoController.get(
	"/",
	verifyAdminAuthentication,
	async (_: Request, res: Response, next: NextFunction) => {
		try {
			const promos = await getPromos();
			res.status(HTTP_STATUS.SUCCESSFUL.OK).send(promos);
		} catch (err) {
			next(err);
		}
	},
);
