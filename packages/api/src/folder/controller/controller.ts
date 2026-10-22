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
} from "../../middleware/index.js";
import { folderService } from "../service/index.js";
import {
	validatePatchFolderRequest,
	validateFolderRequest,
	validateGetFoldersQuery,
	validateGetFoldersPageQuery,
} from "../validators.js";
import { validatePaginationParameters } from "../../validators/shared.js";
import {
	validateOptionalAuthentication,
	validateUserAuthentication,
} from "../../validators/index.js";
import { HTTP_STATUS } from "@pdc/http-status-codes";

export const folderController = Router();

folderController.patch(
	"/:folderId",
	verifyUserAuthentication,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const auth = req.metadata?.auth;
			validateUserAuthentication(auth);
			validateFolderRequest(req.params);
			validatePatchFolderRequest(req.body);
			const folderId = await folderService.patchFolder(
				req.params.folderId,
				auth.email,
				req.body,
			);
			const [folder] = await folderService.getFolders([folderId], auth.email);
			if (folder === undefined) {
				res
					.status(HTTP_STATUS.CLIENT_ERROR.NOT_FOUND)
					.json({ error: "Folder not found" });
				return;
			}

			res.status(HTTP_STATUS.SUCCESSFUL.OK).send({ data: folder });
		} catch (err) {
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
			const auth = req.metadata?.auth ?? {};
			validateOptionalAuthentication(auth);
			validateGetFoldersQuery(req.query);
			const folders = await folderService.getFolders(
				req.query.folderIds,
				auth.email,
				auth.shareToken,
			);
			res.status(HTTP_STATUS.SUCCESSFUL.OK).send({ items: folders });
		} catch (err) {
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
			const auth = req.metadata?.auth ?? {};
			validateOptionalAuthentication(auth);
			validatePaginationParameters(req.query);
			validateFolderRequest(req.params);
			const response = await folderService.getFolderChildren(
				req.params.folderId,
				{ pageSize: req.query.pageSize, cursor: req.query.cursor },
				auth.email,
				auth.shareToken,
			);
			res.status(HTTP_STATUS.SUCCESSFUL.OK).send(response);
		} catch (err) {
			next(err);
		}
	},
);

folderController.get(
	"/:folderId/share_links",
	verifyUserAuthentication,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const auth = req.metadata?.auth;
			validateUserAuthentication(auth);
			validateFolderRequest(req.params);
			const shareLinks = await folderService.getFolderShareLinks(
				auth.email,
				req.params.folderId,
			);
			res.status(HTTP_STATUS.SUCCESSFUL.OK).send({ items: shareLinks });
		} catch (err) {
			next(err);
		}
	},
);

export const foldersController = Router();

foldersController.get(
	"/",
	extractUserEmailFromAuthToken,
	extractShareTokenFromHeaders,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const auth = req.metadata?.auth ?? {};
			validateOptionalAuthentication(auth);
			validateGetFoldersPageQuery(req.query);
			const response = await folderService.getFoldersPage({
				folderIds: req.query.folderIds,
				email: auth.email,
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

// Handles all other /folders routes (e.g. PATCH /:folderId, /:folderId/children)
// that are identical to the deprecated /folder alias.
foldersController.use(folderController);
