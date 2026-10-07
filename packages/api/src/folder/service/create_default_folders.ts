import createError from "http-errors";
import { logger } from "@stela/logger";
import type { TinyPg } from "tinypg";
import { FolderType } from "../models.js";

interface CreateFolderParams {
	archiveId: string;
	archiveNbr: string;
	archivePart: string;
	itemPart: string;
	displayName: string;
	downloadName: string;
	description: string | null;
	type: FolderType;
	publicDt: string | null;
	parentFolderId: string | null;
	parentFolderLinkId: string | null;
	position: number;
	folderLinkType: string;
}

const createFolder = async (
	params: CreateFolderParams,
	transactionDb: TinyPg,
): Promise<{ folderId: string; folderLinkId: string }> => {
	const result = await transactionDb
		.sql<{
			folderId: string;
			folderLinkId: string;
		}>("folder.queries.create_folder", params)
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError("Failed to create folder");
		});
	const { rows } = result;
	const [folder] = rows;
	if (folder === undefined) {
		throw new createError.InternalServerError("Failed to create folder");
	}
	return folder;
};

const yesterdayIsoString = (): string => {
	const date = new Date();
	date.setDate(date.getDate() - 1);
	return date.toISOString();
};

export const createDefaultFolders = async (
	archiveId: string,
	archivePart: string,
	db: TinyPg,
): Promise<{ rootFolderId: string }> => {
	const root = await createFolder(
		{
			archiveId,
			archiveNbr: `${archivePart}-0001`,
			archivePart,
			itemPart: "0001",
			displayName: "Archive Root",
			downloadName: "Archive Root",
			description: null,
			type: FolderType.RootRoot,
			publicDt: null,
			parentFolderId: null,
			parentFolderLinkId: null,
			position: 1,
			folderLinkType: "type.folder_link.root.root",
		},
		db,
	);

	await createFolder(
		{
			archiveId,
			archiveNbr: `${archivePart}-0002`,
			archivePart,
			itemPart: "0002",
			displayName: "Apps",
			downloadName: "Apps",
			description: "pages.apps.description",
			type: FolderType.RootApp,
			publicDt: null,
			parentFolderId: root.folderId,
			parentFolderLinkId: root.folderLinkId,
			position: 1,
			folderLinkType: "type.folder_link.root.app",
		},
		db,
	);

	await createFolder(
		{
			archiveId,
			archiveNbr: `${archivePart}-0003`,
			archivePart,
			itemPart: "0003",
			displayName: "My Files",
			downloadName: "My Files",
			description: "pages.private.description",
			type: FolderType.RootPrivate,
			publicDt: null,
			parentFolderId: root.folderId,
			parentFolderLinkId: root.folderLinkId,
			position: 1,
			folderLinkType: "type.folder_link.root.private",
		},
		db,
	);

	await createFolder(
		{
			archiveId,
			archiveNbr: `${archivePart}-0004`,
			archivePart,
			itemPart: "0004",
			displayName: "Public",
			downloadName: "Public",
			description: "pages.public.description",
			type: FolderType.RootPublic,
			publicDt: yesterdayIsoString(),
			parentFolderId: root.folderId,
			parentFolderLinkId: root.folderLinkId,
			position: 1,
			folderLinkType: "type.folder_link.root.public",
		},
		db,
	);

	return { rootFolderId: root.folderId };
};
