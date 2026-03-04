import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { verifyUserAuthentication } from "../middleware";
import {
	validateStoragePurchaseRequest,
	validateStripeWebhookBody,
} from "./validators";
import { isValidationError } from "../validators/validator_util";
import { initiateStoragePurchase, handleStripeWebhook } from "./service";
import { HTTP_STATUS } from "@pdc/http-status-codes";

export const storagePurchaseController = Router();

storagePurchaseController.post(
	"/stripe/webhook",
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const {
				headers: { "stripe-signature": signature },
			} = req;
			if (typeof signature !== "string") {
				res.status(HTTP_STATUS.CLIENT_ERROR.BAD_REQUEST).end();
				return;
			}
			validateStripeWebhookBody(req.body);
			await handleStripeWebhook(req.body, signature);
			res.status(HTTP_STATUS.SUCCESSFUL.OK).end();
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

storagePurchaseController.post(
	"/",
	verifyUserAuthentication,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			validateStoragePurchaseRequest(req.body);
			const result = await initiateStoragePurchase(req.body);
			res.status(HTTP_STATUS.SUCCESSFUL.CREATED).json({ data: result });
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
