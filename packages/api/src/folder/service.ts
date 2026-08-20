import createError from "http-errors";
import { logger } from "@stela/logger";
import type { TinyPg } from "tinypg";
import { db } from "../database.js";
import type {
	FolderRow,
	Folder,
	PatchFolderRequest,
	GetFolderChildrenResponse,
	GetFoldersResponse,
	FolderChildItem,
} from "./models.js";
import {
	FolderType,
	FolderStatus,
	FolderView,
	FolderSortOrder,
	PrettyFolderSortOrder,
	PrettyFolderType,
	PrettyFolderStatus,
	PrettyFolderView,
} from "./models.js";
import {
	getFolderAccessRole,
	accessRoleLessThan,
} from "../access/permission.js";
import { AccessRole } from "../access/models.js";
import { getRecords } from "../record/service.js";
import { shareLinkService } from "../share_link/service.js";
import type { ShareLink } from "../share_link/models.js";
import { insertLocation, updateLocation } from "../location/service.js";

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

const mapFolderRow = (row: FolderRow): Folder => ({
	...row,
	size: row.size === null ? null : +row.size,
	imageRatio: +(row.imageRatio ?? 0),
	sort: prettifyFolderSortType(row.sort),
	type: prettifyFolderType(row.type),
	status: prettifyFolderStatus(row.status),
	view: prettifyFolderView(row.view),
});

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
			pageSize: null,
			cursor: undefined,
		})
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError("Failed to retrieve folders");
		});

	return result.rows.map<Folder>(mapFolderRow);
};

const buildFoldersNextPageUrl = (
	requestQuery: {
		folderIds: string[];
		pageSize: number;
	},
	nextCursor: string,
): string => {
	const params = new URLSearchParams();
	requestQuery.folderIds.forEach((folderId) => {
		params.append("folderIds[]", folderId);
	});
	params.set("pageSize", String(requestQuery.pageSize));
	params.set("cursor", nextCursor);
	return `https://${process.env["SITE_URL"] ?? ""}/api/v2/folders?${params.toString()}`;
};

export const getFoldersPage = async (requestQuery: {
	folderIds: string[];
	email: string | undefined;
	shareToken: string | undefined;
	pageSize: number;
	cursor: string | undefined;
}): Promise<GetFoldersResponse> => {
	const result = await db
		.sql<FolderRow & { rank: string; totalPages: number }>(
			"folder.queries.get_folders",
			{
				folderIds: requestQuery.folderIds,
				email: requestQuery.email,
				shareToken: requestQuery.shareToken,
				pageSize: requestQuery.pageSize,
				cursor: requestQuery.cursor,
			},
		)
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError("Failed to retrieve folders");
		});

	const items = result.rows.map((row) => {
		const { rank: _rank, totalPages: _totalPages, ...folderRow } = row;
		return mapFolderRow(folderRow);
	});

	const nextCursor = items[items.length - 1]?.folderId;

	return {
		items,
		pagination: {
			nextCursor,
			nextPage:
				nextCursor === undefined
					? undefined
					: buildFoldersNextPageUrl(requestQuery, nextCursor),
			totalPages: result.rows[0]?.totalPages ?? 0,
		},
	};
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
				accumulator.push({ ...child, itemType: row.item_type });
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

const getFolderLocationId = async (
	folderId: string,
	client: TinyPg,
): Promise<string | null> => {
	const result = await client
		.sql<{ locationId: string | null }>(
			"folder.queries.get_folder_location_id",
			{
				folderId,
			},
		)
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError("Failed to look up folder");
		});
	const { rows } = result;
	const [row] = rows;
	if (row === undefined) {
		throw new createError.NotFound(`Folder ${folderId} not found`);
	}
	return row.locationId;
};

export const patchFolder = async (
	folderId: string,
	folderData: PatchFolderRequest,
): Promise<string> => {
	await validateCanPatchFolder(folderId, folderData.emailFromAuthToken);

	return await db.transaction(async (transactionDb) => {
		let locationId: string | null = null;
		if (folderData.location !== undefined) {
			const currentLocationId = await getFolderLocationId(
				folderId,
				transactionDb,
			);
			if (currentLocationId === null) {
				locationId = await insertLocation(folderData.location, transactionDb);
			} else {
				await updateLocation(
					currentLocationId,
					folderData.location,
					transactionDb,
				);
				locationId = currentLocationId;
			}
		}

		const result = await transactionDb
			.sql<{ folderId: string }>("folder.queries.update_folder", {
				folderId,
				displayDate: folderData.displayDate,
				setDisplayDateToNull: folderData.displayDate === null,
				displayEndDate: folderData.displayEndDate,
				setDisplayEndDateToNull: folderData.displayEndDate === null,
				displayTime: folderData.displayTime,
				setDisplayTimeToNull: folderData.displayTime === null,
				timezone: folderData.location?.timezone,
				setTimezoneToNull: folderData.location?.timezone === null,
				locationId,
			})
			.catch((err: unknown) => {
				logger.error(err);
				throw new createError.InternalServerError("Failed to update folder");
			});

		if (result.rows[0] === undefined) {
			throw new createError.NotFound("Folder not found");
		}
		return result.rows[0].folderId;
	});
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
		{ pageSize: null, cursor: undefined },
	);
	return shareLinks.items;
};
