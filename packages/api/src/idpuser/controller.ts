import {
	Router,
	type Response,
	type Request,
	type NextFunction,
} from "express";
import { verifyUserAuthentication } from "../middleware";
import { isValidationError } from "../validators/validator_util";
import { validateBodyFromAuthentication } from "../validators";
import {
	validateSendEnableCodeRequest,
	validateSendDisableCodeRequest,
	validateCreateTwoFactorMethodRequest,
	validateDisableTwoFactorRequest,
} from "./validators";
import {
	getTwoFactorMethods,
	sendEnableCode,
	addTwoFactorMethod,
	sendDisableCode,
	removeTwoFactorMethod,
} from "./service";
import { HTTP_STATUS } from "@pdc/http-status-codes";

export const idpUserController = Router();

idpUserController.get(
	"/",
	verifyUserAuthentication,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			validateBodyFromAuthentication(req.body);
			const response = await getTwoFactorMethods(req.body.emailFromAuthToken);

			res.send(response);
		} catch (err) {
			if (isValidationError(err)) {
				res.status(HTTP_STATUS.CLIENT_ERROR.BAD_REQUEST).json({ error: err });
				return;
			}
			next(err);
		}
	},
);

idpUserController.post(
	"/send-enable-code",
	verifyUserAuthentication,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			validateSendEnableCodeRequest(req.body);
			await sendEnableCode(req.body);
			res.send(HTTP_STATUS.SUCCESSFUL.OK);
		} catch (err) {
			if (isValidationError(err)) {
				res.status(HTTP_STATUS.CLIENT_ERROR.BAD_REQUEST).json({ error: err });
				return;
			}
			next(err);
		}
	},
);

idpUserController.post(
	"/enable-two-factor",
	verifyUserAuthentication,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			validateCreateTwoFactorMethodRequest(req.body);
			await addTwoFactorMethod(req.body);
			res.status(HTTP_STATUS.SUCCESSFUL.OK).send();
		} catch (err) {
			if (isValidationError(err)) {
				res.status(HTTP_STATUS.CLIENT_ERROR.BAD_REQUEST).json({ error: err });
				return;
			}
			next(err);
		}
	},
);

idpUserController.post(
	"/send-disable-code",
	verifyUserAuthentication,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			validateSendDisableCodeRequest(req.body);
			await sendDisableCode(req.body);
			res.send(HTTP_STATUS.SUCCESSFUL.OK);
		} catch (err) {
			if (isValidationError(err)) {
				res.status(HTTP_STATUS.CLIENT_ERROR.BAD_REQUEST).json({ error: err });
				return;
			}
			next(err);
		}
	},
);

idpUserController.post(
	"/disable-two-factor",
	verifyUserAuthentication,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			validateDisableTwoFactorRequest(req.body);
			await removeTwoFactorMethod(req.body);
			res.send(HTTP_STATUS.SUCCESSFUL.OK);
		} catch (err) {
			if (isValidationError(err)) {
				res.status(HTTP_STATUS.CLIENT_ERROR.BAD_REQUEST).json({ error: err });
				return;
			}
			next(err);
		}
	},
);
