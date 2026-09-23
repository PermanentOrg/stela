import { patchFolder } from "./update_folder.js";
import { getFolders, getFoldersPage, getFolderChildren } from "./get_folder.js";
import { getFolderShareLinks } from "./get_folder_share_links.js";
import { createDefaultFolders } from "./create_default_folders.js";

export const folderService = {
	getFolders,
	getFoldersPage,
	getFolderChildren,
	patchFolder,
	getFolderShareLinks,
	createDefaultFolders,
};
