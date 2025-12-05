import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { verifyUserAuthentication } from "../middleware";
import { validateGiftStorageRequest } from "./validators";
import { isValidationError } from "../validators/validator_util";
import { issueGift } from "./service";
import { HTTP_STATUS } from "@pdc/http-status-codes";

export const storageController = Router();

storageController.post(
	"/gift",
	verifyUserAuthentication,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			validateGiftStorageRequest(req.body);
			const result = await issueGift(req.body);

			res.status(HTTP_STATUS.SUCCESSFUL.OK).json(result);
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
