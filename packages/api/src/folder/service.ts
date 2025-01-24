import createError from "http-errors";
import { logger } from "@stela/logger";
import { db } from "../database";
import type {
  Folder,
  FolderColumnsForUpdate,
  PatchFolderRequest,
} from "./models";
import { requestFieldsToDatabaseFields } from "./helper";
import { getFolderAccessRole, accessRoleLessThan } from "../access/permission";
import { AccessRole } from "../access/models";

export const getFolderById = async (requestQuery: {
  folderId: string;
}): Promise<Folder> => {
  const folder = await db
    .sql<Folder>("folder.queries.get_folder_by_id", {
      folderId: requestQuery.folderId,
    })
    .catch((err) => {
      logger.error(err);
      throw new createError.InternalServerError("Failed to retrieve folder");
    });

  if (folder.rows[0] === undefined) {
    throw new createError.NotFound("Folder not found.");
  }

  return folder.rows[0];
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
