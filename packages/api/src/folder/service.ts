import createError from "http-errors";
import { logger } from "@stela/logger";
import { db } from "../database";
import type {
	FolderRow,
	Folder,
	PatchFolderRequest,
	GetFolderChildrenResponse,
	FolderChildItem,
} from "./models";
import {
	FolderType,
	FolderStatus,
	FolderView,
	FolderSortOrder,
	PrettyFolderSortOrder,
	PrettyFolderType,
	PrettyFolderStatus,
	PrettyFolderView,
} from "./models";
import { getFolderAccessRole, accessRoleLessThan } from "../access/permission";
import { AccessRole } from "../access/models";
import { getRecords } from "../record/service";
import { shareLinkService } from "../share_link/service";
import type { ShareLink } from "../share_link/models";

export const prettifyFolderSortType = (
	sortType: FolderSortOrder,
): PrettyFolderSortOrder => {
	switch (sortType) {
		case FolderSortOrder.DisplayDateDescending:
			return PrettyFolderSortOrder.DateDescending;
		case FolderSortOrder.DisplayDateAscending:
			return PrettyFolderSortOrder.DateAscending;
		case FolderSortOrder.TypeDescending:
			return PrettyFolderSortOrder.TypeDescending;
		case FolderSortOrder.TypeAscending:
			return PrettyFolderSortOrder.TypeAscending;
		case FolderSortOrder.AlphabeticalDescending:
			return PrettyFolderSortOrder.AlphabeticalDescending;
		case FolderSortOrder.AlphabeticalAscending:
			return PrettyFolderSortOrder.AlphabeticalAscending;
	}
};

export const prettifyFolderType = (type: FolderType): PrettyFolderType => {
	switch (type) {
		case FolderType.App:
			return PrettyFolderType.App;
		case FolderType.RootApp:
			return PrettyFolderType.AppRoot;
		case FolderType.Private:
			return PrettyFolderType.Private;
		case FolderType.RootPrivate:
			return PrettyFolderType.PrivateRoot;
		case FolderType.Public:
			return PrettyFolderType.Public;
		case FolderType.RootPublic:
			return PrettyFolderType.PublicRoot;
		case FolderType.RootRoot:
			return PrettyFolderType.Root;
		case FolderType.RootShare:
			return PrettyFolderType.ShareRoot;
		default:
			return PrettyFolderType.Deprecated;
	}
};

export const prettifyFolderStatus = (
	status: FolderStatus,
): PrettyFolderStatus => {
	switch (status) {
		case FolderStatus.Ok:
			return PrettyFolderStatus.Ok;
		case FolderStatus.Copying:
			return PrettyFolderStatus.Copying;
		case FolderStatus.Moving:
			return PrettyFolderStatus.Moving;
		case FolderStatus.Deleted:
			return PrettyFolderStatus.Deleted;
	}
};

export const prettifyFolderView = (view: FolderView): PrettyFolderView => {
	switch (view) {
		case FolderView.Grid:
			return PrettyFolderView.Grid;
		case FolderView.List:
			return PrettyFolderView.List;
		case FolderView.Timeline:
			return PrettyFolderView.Timeline;
		default:
			return PrettyFolderView.Deprecated;
	}
};

export const getFolders = async (
	folderIds: string[],
	email?: string,
	shareToken?: string,
): Promise<Folder[]> => {
	const result = await db
		.sql<FolderRow>("folder.queries.get_folders", {
			folderIds,
			email,
			shareToken,
		})
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError("Failed to retrieve folders");
		});

	const folders = result.rows.map<Folder>(
		(row: FolderRow): Folder => ({
			...row,
			size: row.size === null ? null : +row.size,
			imageRatio: +(row.imageRatio ?? 0),
			sort: prettifyFolderSortType(row.sort),
			type: prettifyFolderType(row.type),
			status: prettifyFolderStatus(row.status),
			view: prettifyFolderView(row.view),
		}),
	);
	return folders;
};

export const getFolderChildren = async (
	parentFolderId: string,
	pagination: {
		pageSize: number;
		cursor: string | undefined;
	},
	email?: string,
	shareToken?: string,
): Promise<GetFolderChildrenResponse> => {
	const result = await db
		.sql<{ id: string; item_type: "folder" | "record"; totalPages: number }>(
			"folder.queries.get_folder_children",
			{
				parentFolderId,
				pageSize: pagination.pageSize,
				cursor: pagination.cursor,
				email,
				shareToken,
			},
		)
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError(
				"Failed to retrieve folder children",
			);
		});

	const folders = await getFolders(
		result.rows
			.filter((item) => item.item_type === "folder")
			.map((folder) => folder.id),
		email,
		shareToken,
	);

	const records = await getRecords({
		recordIds: result.rows
			.filter((item) => item.item_type === "record")
			.map((record) => record.id),
		archiveId: undefined,
		accountEmail: email,
		shareToken,
	});

	const children: FolderChildItem[] = result.rows.reduce(
		(accumulator: FolderChildItem[], row) => {
			const child =
				row.item_type === "folder"
					? folders.find((folder) => folder.folderId === row.id)
					: records.find((record) => record.recordId === row.id);
			if (child !== undefined) {
				accumulator.push(child);
			}
			return accumulator;
		},
		[],
	);

	const nextCursor = children[children.length - 1]?.folderLinkId;
	return {
		items: children,
		pagination: {
			nextCursor,
			nextPage:
				nextCursor === undefined
					? undefined
					: `https://${
							process.env["SITE_URL"] ?? ""
						}/api/v2/folders/${parentFolderId}/children?pageSize=${pagination.pageSize}&cursor=${nextCursor}`,
			totalPages: result.rows[0] === undefined ? 0 : result.rows[0].totalPages,
		},
	};
};

const validateCanPatchFolder = async (
	folderId: string,
	emailFromAuthToken: string,
): Promise<void> => {
	const accessRole = await getFolderAccessRole(folderId, emailFromAuthToken);
	if (accessRoleLessThan(accessRole, AccessRole.Editor)) {
		throw new createError.Forbidden(
			"User does not have permission to modify folder.",
		);
	}
};

export const patchFolder = async (
	folderId: string,
	folderData: PatchFolderRequest,
): Promise<string> => {
	await validateCanPatchFolder(folderId, folderData.emailFromAuthToken);

	const result = await db
		.sql<{ folderId: string }>("folder.queries.update_folder", {
			folderId,
			displayDate: folderData.displayDate,
			setDisplayDateToNull: folderData.displayDate === null,
			displayEndDate: folderData.displayEndDate,
			setDisplayEndDateToNull: folderData.displayEndDate === null,
			displayTime: folderData.displayTimeInEDTF,
			setDisplayTimeToNull: folderData.displayTimeInEDTF === null,
		})
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError("Failed to update folder");
		});

	if (result.rows[0] === undefined) {
		throw new createError.NotFound("Folder not found");
	}
	return result.rows[0].folderId;
};

export const getFolderShareLinks = async (
	email: string,
	folderId: string,
): Promise<ShareLink[]> => {
	const folderShareLinkIds = await db
		.sql<{ id: string }>("folder.queries.get_folder_share_links", {
			email,
			folderId,
		})
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError(
				"Failed to get folder share links",
			);
		});

	const shareLinkIds = folderShareLinkIds.rows.map((row) => row.id);
	const shareLinks = await shareLinkService.getShareLinks(
		email,
		[],
		shareLinkIds,
	);
	return shareLinks;
};
