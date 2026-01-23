import {
	Router,
	type Request,
	type Response,
	type NextFunction,
} from "express";
import {
	extractShareTokenFromHeaders,
	extractUserEmailFromAuthToken,
	verifyUserAuthentication,
} from "../middleware";
import { getRecordById, patchRecord, getRecordShareLinks } from "./service";
import {
	validateGetRecordQuery,
	validatePatchRecordRequest,
	validateSingleRecordParams,
} from "./validators";
import {
	validateBodyFromAuthentication,
	validateOptionalAuthenticationValues,
} from "../validators/shared";
import { isValidationError } from "../validators/validator_util";
import { HTTP_STATUS } from "@pdc/http-status-codes";

export const recordController = Router();

recordController.get(
	"/",
	extractUserEmailFromAuthToken,
	extractShareTokenFromHeaders,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			validateOptionalAuthenticationValues(req.body);
			validateGetRecordQuery(req.query);
			const records = await getRecordById({
				recordIds: req.query.recordIds,
				accountEmail: req.body.emailFromAuthToken,
				shareToken: req.body.shareToken,
			});
			res.send(records);
		} catch (error) {
			if (isValidationError(error)) {
				res
					.status(HTTP_STATUS.CLIENT_ERROR.BAD_REQUEST)
					.json({ error: error.message });
				return;
			}
			next(error);
		}
	},
);

recordController.get(
	"/:recordId",
	extractUserEmailFromAuthToken,
	extractShareTokenFromHeaders,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			validateOptionalAuthenticationValues(req.body);
			validateSingleRecordParams(req.params);
			const records = await getRecordById({
				recordIds: [req.params.recordId],
				accountEmail: req.body.emailFromAuthToken,
				shareToken: req.body.shareToken,
			});
			res.send({ data: records[0] });
		} catch (error) {
			if (isValidationError(error)) {
				res
					.status(HTTP_STATUS.CLIENT_ERROR.BAD_REQUEST)
					.json({ error: error.message });
				return;
			}
			next(error);
		}
	},
);

recordController.patch(
	"/:recordId",
	verifyUserAuthentication,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			validateSingleRecordParams(req.params);
			validatePatchRecordRequest(req.body);
			const recordId = await patchRecord(req.params.recordId, req.body);
			const record = await getRecordById({
				recordIds: [recordId],
				accountEmail: req.body.emailFromAuthToken,
			});

			res.status(HTTP_STATUS.SUCCESSFUL.OK).send({ data: record });
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

recordController.get(
	"/:recordId/share-links",
	verifyUserAuthentication,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			validateSingleRecordParams(req.params);
			validateBodyFromAuthentication(req.body);
			const shareLinks = await getRecordShareLinks(
				req.body.emailFromAuthToken,
				req.params.recordId,
			);
			res.status(HTTP_STATUS.SUCCESSFUL.OK).send({ items: shareLinks });
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
