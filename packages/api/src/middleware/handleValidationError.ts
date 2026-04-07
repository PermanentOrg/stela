import type { Request, Response, NextFunction } from "express";
import { isValidationError } from "../validators/validator_util";
import { HTTP_STATUS } from "@pdc/http-status-codes";

export const handleValidationError = (
	err: unknown,
	_req: Request,
	res: Response,
	next: NextFunction,
): void => {
	if (isValidationError(err)) {
		res
			.status(HTTP_STATUS.CLIENT_ERROR.BAD_REQUEST)
			.json({ error: err.message });
		return;
	}
	next(err);
};
