import createError from "http-errors";
import { logger } from "@stela/logger";
import { db } from "../database";
import type {
  FolderRow,
  Folder,
  FolderColumnsForUpdate,
  PatchFolderRequest,
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
import { requestFieldsToDatabaseFields } from "./helper";
import { getFolderAccessRole, accessRoleLessThan } from "../access/permission";
import { AccessRole } from "../access/models";

const prettifyFolderSortType = (
  sortType: FolderSortOrder
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

const prettifyFolderType = (type: FolderType): PrettyFolderType => {
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

const prettifyFolderStatus = (status: FolderStatus): PrettyFolderStatus => {
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

const prettifyFolderView = (view: FolderView): PrettyFolderView => {
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
  shareToken?: string
): Promise<Folder[]> => {
  const result = await db
    .sql<FolderRow>("folder.queries.get_folders", {
      folderIds,
      email,
      shareToken,
    })
    .catch((err) => {
      logger.error(err);
      throw new createError.InternalServerError("Failed to retrieve folders");
    });

  const folders = result.rows.map<Folder>(
    (row: FolderRow): Folder => ({
      ...row,
      size: +row.size,
      imageRatio: +(row.imageRatio ?? 0),
      sort: prettifyFolderSortType(row.sort),
      type: prettifyFolderType(row.type),
      status: prettifyFolderStatus(row.status),
      view: prettifyFolderView(row.view),
    })
  );
  return folders;
};

function buildPatchQuery(patchFolderRequest: FolderColumnsForUpdate): string {
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
}

const validateCanPatchFolder = async (
  folderId: string,
  emailFromAuthToken: string
): Promise<void> => {
  const accessRole = await getFolderAccessRole(folderId, emailFromAuthToken);
  if (accessRoleLessThan(accessRole, AccessRole.Editor)) {
    throw new createError.Forbidden(
      "User does not have permission to modify folder."
    );
  }
};

export const patchFolder = async (
  folderId: string,
  folderData: PatchFolderRequest
): Promise<string> => {
  await validateCanPatchFolder(folderId, folderData.emailFromAuthToken);
  const columnsForUpdate = requestFieldsToDatabaseFields(folderData, folderId);
  const query = buildPatchQuery(columnsForUpdate);

  const result = await db
    .query<{ folderId: string }>(query, columnsForUpdate)
    .catch((err) => {
      logger.error(err);
      throw new createError.InternalServerError("Failed to update folder");
    });

  if (result.rows[0] === undefined) {
    throw new createError.NotFound("Folder not found");
  }
  return result.rows[0].folderId;
};
