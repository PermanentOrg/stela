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
	extractIp,
} from "../../middleware/index.js";
import {
	getRecords,
	getRecordsPage,
	patchRecord,
	getRecordShareLinks,
	createRecordCopy,
} from "../service.js";
import {
	validateGetRecordQuery,
	validateGetRecordsPageQuery,
	validatePatchRecordRequest,
	validateSingleRecordParams,
	validateCreateRecordCopyRequest,
} from "../validators.js";
import {
	validateClientIp,
	validateOptionalAuthentication,
	validateUserAuthentication,
} from "../../validators/index.js";
import { HTTP_STATUS } from "@pdc/http-status-codes";

export const recordController = Router();

recordController.get(
	"/",
	extractUserEmailFromAuthToken,
	extractShareTokenFromHeaders,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const auth = req.metadata?.auth ?? {};
			validateOptionalAuthentication(auth);
			validateGetRecordQuery(req.query);
			const records = await getRecords({
				recordIds: req.query.recordIds,
				archiveId: req.query.archiveId,
				accountEmail: auth.email,
				shareToken: auth.shareToken,
			});
			res.send(records);
		} catch (error) {
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
			const auth = req.metadata?.auth ?? {};
			validateOptionalAuthentication(auth);
			validateSingleRecordParams(req.params);
			const records = await getRecords({
				recordIds: [req.params.recordId],
				archiveId: undefined,
				accountEmail: auth.email,
				shareToken: auth.shareToken,
			});
			res.send({ data: records[0] });
		} catch (error) {
			next(error);
		}
	},
);

recordController.patch(
	"/:recordId",
	verifyUserAuthentication,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const auth = req.metadata?.auth;
			validateUserAuthentication(auth);
			validateSingleRecordParams(req.params);
			validatePatchRecordRequest(req.body);
			const recordId = await patchRecord(
				req.params.recordId,
				auth.email,
				req.body,
			);
			const record = await getRecords({
				recordIds: [recordId],
				archiveId: undefined,
				accountEmail: auth.email,
			});

			res.status(HTTP_STATUS.SUCCESSFUL.OK).send({ data: record[0] });
		} catch (err) {
			next(err);
		}
	},
);

recordController.get(
	"/:recordId/share-links",
	verifyUserAuthentication,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const auth = req.metadata?.auth;
			validateUserAuthentication(auth);
			validateSingleRecordParams(req.params);
			const shareLinks = await getRecordShareLinks(
				auth.email,
				req.params.recordId,
			);
			res.status(HTTP_STATUS.SUCCESSFUL.OK).send({ items: shareLinks });
		} catch (err) {
			next(err);
		}
	},
);

recordController.post(
	"/:recordId/copies",
	verifyUserAuthentication,
	extractIp,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const auth = req.metadata?.auth;
			validateUserAuthentication(auth);
			const clientIp = req.metadata?.clientIp;
			validateClientIp(clientIp);
			validateSingleRecordParams(req.params);
			validateCreateRecordCopyRequest(req.body);
			const record = await createRecordCopy(req.params.recordId, req.body, {
				email: auth.email,
				ip: clientIp,
				userAgent: req.headers["user-agent"],
			});
			res.status(HTTP_STATUS.SUCCESSFUL.OK).send({ data: record });
		} catch (err) {
			next(err);
		}
	},
);

export const recordsController = Router();

recordsController.get(
	"/",
	extractUserEmailFromAuthToken,
	extractShareTokenFromHeaders,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const auth = req.metadata?.auth ?? {};
			validateOptionalAuthentication(auth);
			validateGetRecordsPageQuery(req.query);
			const response = await getRecordsPage({
				recordIds: req.query.recordIds,
				archiveId: req.query.archiveId,
				accountEmail: auth.email,
				shareToken: auth.shareToken,
				pageSize: req.query.pageSize,
				cursor: req.query.cursor,
			});
			res.status(HTTP_STATUS.SUCCESSFUL.OK).send(response);
		} catch (err) {
			next(err);
		}
	},
);

// Handles all other /records routes (e.g. PATCH/:recordId, /:recordId/copies)
// that are identical to the deprecated /record alias.
recordsController.use(recordController);
