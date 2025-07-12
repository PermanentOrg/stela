import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { verifyAdminAuthentication } from "../middleware/authentication";
import { validateCreatePromoRequest } from "./validators";
import { isValidationError } from "../validators/validator_util";
import { createPromo, getPromos } from "./service";
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
			if (isValidationError(err)) {
				res
					.status(HTTP_STATUS.CLIENT_ERROR.BAD_REQUEST)
					.json({ error: err.message });
				return;
			}
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
