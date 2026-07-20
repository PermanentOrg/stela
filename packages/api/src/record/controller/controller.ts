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
	validateBodyFromAuthentication,
	validateOptionalAuthenticationValues,
} from "../../validators/shared.js";
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
			const records = await getRecords({
				recordIds: req.query.recordIds,
				archiveId: req.query.archiveId,
				accountEmail: req.body.emailFromAuthToken,
				shareToken: req.body.shareToken,
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
			validateOptionalAuthenticationValues(req.body);
			validateSingleRecordParams(req.params);
			const records = await getRecords({
				recordIds: [req.params.recordId],
				archiveId: undefined,
				accountEmail: req.body.emailFromAuthToken,
				shareToken: req.body.shareToken,
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
			validateSingleRecordParams(req.params);
			validatePatchRecordRequest(req.body);
			const recordId = await patchRecord(req.params.recordId, req.body);
			const record = await getRecords({
				recordIds: [recordId],
				archiveId: undefined,
				accountEmail: req.body.emailFromAuthToken,
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
			validateSingleRecordParams(req.params);
			validateBodyFromAuthentication(req.body);
			const shareLinks = await getRecordShareLinks(
				req.body.emailFromAuthToken,
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
			validateSingleRecordParams(req.params);
			validateCreateRecordCopyRequest(req.body);
			const record = await createRecordCopy(
				req.params.recordId,
				req.body,
				req.headers["user-agent"],
			);
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
			validateOptionalAuthenticationValues(req.body);
			validateGetRecordsPageQuery(req.query);
			const response = await getRecordsPage({
				recordIds: req.query.recordIds,
				archiveId: req.query.archiveId,
				accountEmail: req.body.emailFromAuthToken,
				shareToken: req.body.shareToken,
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
