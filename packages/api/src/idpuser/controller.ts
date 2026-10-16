import {
	Router,
	type Response,
	type Request,
	type NextFunction,
} from "express";
import { verifyUserAuthentication } from "../middleware/index.js";
import { validateUserAuthentication } from "../validators/index.js";
import {
	validateSendEnableCodeRequest,
	validateSendDisableCodeRequest,
	validateCreateTwoFactorMethodRequest,
	validateDisableTwoFactorRequest,
} from "./validators.js";
import {
	getTwoFactorMethods,
	sendEnableCode,
	addTwoFactorMethod,
	sendDisableCode,
	removeTwoFactorMethod,
} from "./service.js";
import { HTTP_STATUS } from "@pdc/http-status-codes";

export const idpUserController = Router();

idpUserController.get(
	"/",
	verifyUserAuthentication,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const auth = req.metadata?.auth;
			validateUserAuthentication(auth);
			const response = await getTwoFactorMethods(auth.email);

			res.send(response);
		} catch (err) {
			next(err);
		}
	},
);

idpUserController.post(
	"/send-enable-code",
	verifyUserAuthentication,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const auth = req.metadata?.auth;
			validateUserAuthentication(auth);
			validateSendEnableCodeRequest(req.body);
			await sendEnableCode(auth.email, req.body);
			res.send(HTTP_STATUS.SUCCESSFUL.OK);
		} catch (err) {
			next(err);
		}
	},
);

idpUserController.post(
	"/enable-two-factor",
	verifyUserAuthentication,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const auth = req.metadata?.auth;
			validateUserAuthentication(auth);
			validateCreateTwoFactorMethodRequest(req.body);
			await addTwoFactorMethod(auth.email, req.body);
			res.status(HTTP_STATUS.SUCCESSFUL.OK).send();
		} catch (err) {
			next(err);
		}
	},
);

idpUserController.post(
	"/send-disable-code",
	verifyUserAuthentication,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const auth = req.metadata?.auth;
			validateUserAuthentication(auth);
			validateSendDisableCodeRequest(req.body);
			await sendDisableCode(auth.email, req.body);
			res.send(HTTP_STATUS.SUCCESSFUL.OK);
		} catch (err) {
			next(err);
		}
	},
);

idpUserController.post(
	"/disable-two-factor",
	verifyUserAuthentication,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const auth = req.metadata?.auth;
			validateUserAuthentication(auth);
			validateDisableTwoFactorRequest(req.body);
			await removeTwoFactorMethod(auth.email, req.body);
			res.send(HTTP_STATUS.SUCCESSFUL.OK);
		} catch (err) {
			next(err);
		}
	},
);
