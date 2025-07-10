import createError from "http-errors";
import { logger } from "@stela/logger";
import { db } from "../database";
import type {
	FolderRow,
	Folder,
	FolderColumnsForUpdate,
	PatchFolderRequest,
	GetFolderChildrenResponse,
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
import type { ArchiveRecord } from "../record/models";
import { requestFieldsToDatabaseFields } from "./helper";
import { getFolderAccessRole, accessRoleLessThan } from "../access/permission";
import { AccessRole } from "../access/models";
import { getRecordById } from "../record/service";
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
		default:
			// This should never happen, because the cases above are
			// exhaustive, but just in case
			return PrettyFolderSortOrder.AlphabeticalDescending;
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
		default:
			// This should never happen, because the cases above are
			// exhaustive, but just in case
			return PrettyFolderStatus.Ok;
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
			size: row.size !== null ? +row.size : null,
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
	pageSize: number,
	cursor?: string,
	email?: string,
	shareToken?: string,
): Promise<GetFolderChildrenResponse> => {
	const result = await db
		.sql<{ id: string; item_type: "folder" | "record"; totalPages: number }>(
			"folder.queries.get_folder_children",
			{
				parentFolderId,
				pageSize,
				cursor,
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

	const records = await getRecordById({
		recordIds: result.rows
			.filter((item) => item.item_type === "record")
			.map((record) => record.id),
		accountEmail: email,
		shareToken,
	});

	const children: (ArchiveRecord | Folder)[] = result.rows.reduce(
		(accumulator: (ArchiveRecord | Folder)[], row) => {
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
				nextCursor !== undefined
					? `https://${
							process.env["SITE_URL"] ?? ""
						}/api/v2/folder/${parentFolderId}/children?pageSize=${pageSize}&cursor=${nextCursor}`
					: undefined,
			totalPages: result.rows[0] !== undefined ? result.rows[0].totalPages : 0,
		},
	};
};

const buildPatchQuery = (
	patchFolderRequest: FolderColumnsForUpdate,
): string => {
	const updates = Object.entries(patchFolderRequest)
		.filter(([key, value]) => value !== undefined && key !== "folderId")
		.map(([key, _]) => `${key} = :${key}`);

	if (updates.length === 0) {
		throw new createError.BadRequest("Request cannot be empty");
	}

	const query = `
    UPDATE folder
    SET ${updates.join(", ")}
    WHERE folderid = :folderId
    RETURNING folder.folderid AS "folderId"
  `;

	return query.trim();
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
	const columnsForUpdate = requestFieldsToDatabaseFields(folderData, folderId);
	const query = buildPatchQuery(columnsForUpdate);

	const result = await db
		.query<{ folderId: string }>(query, columnsForUpdate)
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
