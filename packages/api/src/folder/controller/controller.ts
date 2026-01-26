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
} from "../../middleware";
import {
	patchFolder,
	getFolders,
	getFolderChildren,
	getFolderShareLinks,
} from "../service";
import {
	validatePatchFolderRequest,
	validateFolderRequest,
	validateGetFoldersQuery,
} from "../validators";
import { isValidationError } from "../../validators/validator_util";
import {
	validateOptionalAuthenticationValues,
	validatePaginationParameters,
	validateBodyFromAuthentication,
} from "../../validators/shared";
import { HTTP_STATUS } from "@pdc/http-status-codes";

export const folderController = Router();

folderController.patch(
	"/:folderId",
	verifyUserAuthentication,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			validateFolderRequest(req.params);
			validatePatchFolderRequest(req.body);
			const folderId = await patchFolder(req.params.folderId, req.body);
			const [folder] = await getFolders(
				[folderId],
				req.body.emailFromAuthToken,
			);
			if (folder === undefined) {
				res
					.status(HTTP_STATUS.CLIENT_ERROR.NOT_FOUND)
					.json({ error: "Folder not found" });
				return;
			}

			res.status(HTTP_STATUS.SUCCESSFUL.OK).send({ data: folder });
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

folderController.get(
	"/",
	extractUserEmailFromAuthToken,
	extractShareTokenFromHeaders,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			validateOptionalAuthenticationValues(req.body);
			validateGetFoldersQuery(req.query);
			const folders = await getFolders(
				req.query.folderIds,
				req.body.emailFromAuthToken,
				req.body.shareToken,
			);
			res.status(HTTP_STATUS.SUCCESSFUL.OK).send({ items: folders });
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

folderController.get(
	"/:folderId/children",
	extractUserEmailFromAuthToken,
	extractShareTokenFromHeaders,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			validateOptionalAuthenticationValues(req.body);
			validatePaginationParameters(req.query);
			validateFolderRequest(req.params);
			const response = await getFolderChildren(
				req.params.folderId,
				{ pageSize: req.query.pageSize, cursor: req.query.cursor },
				req.body.emailFromAuthToken,
				req.body.shareToken,
			);
			res.status(HTTP_STATUS.SUCCESSFUL.OK).send(response);
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

folderController.get(
	"/:folderId/share_links",
	verifyUserAuthentication,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			validateFolderRequest(req.params);
			validateBodyFromAuthentication(req.body);
			const shareLinks = await getFolderShareLinks(
				req.body.emailFromAuthToken,
				req.params.folderId,
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
