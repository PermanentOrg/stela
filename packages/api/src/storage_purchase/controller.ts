import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { verifyUserAuthentication } from "../middleware";
import { validateStoragePurchaseRequest } from "./validators";
import { isValidationError } from "../validators/validator_util";
import { initiateStoragePurchase } from "./service";
import { HTTP_STATUS } from "@pdc/http-status-codes";

export const storagePurchaseController = Router();

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
