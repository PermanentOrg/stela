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

export const folderController = Router();

folderController.patch(
	"/:folderId",
	verifyUserAuthentication,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			validateFolderRequest(req.params);
			validatePatchFolderRequest(req.body);
			const folderId = await patchFolder(req.params.folderId, req.body);
			const folder = (
				await getFolders([folderId], req.body.emailFromAuthToken)
			)[0];
			if (folder === undefined) {
				res.status(404).json({ error: "Folder not found" });
			}

			res.status(200).send({ data: folder });
		} catch (err) {
			if (isValidationError(err)) {
				res.status(400).json({ error: err.message });
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
			res.status(200).send({ items: folders });
		} catch (err) {
			if (isValidationError(err)) {
				res.status(400).json({ error: err.message });
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
				req.query.pageSize,
				req.query.cursor,
				req.body.emailFromAuthToken,
				req.body.shareToken,
			);
			res.status(200).send(response);
		} catch (err) {
			if (isValidationError(err)) {
				res.status(400).json({ error: err.message });
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
			res.status(200).send({ items: shareLinks });
		} catch (err) {
			if (isValidationError(err)) {
				res.status(400).json({ error: err.message });
				return;
			}
			next(err);
		}
	},
);
