import createError from "http-errors";
import { logger } from "@stela/logger";
import { db } from "../database";
import type {
  FolderColumnsForUpdate,
  FolderRow,
  PatchFolderRequest,
} from "./models";
import { requestFieldsToDatabaseFields } from "./helper";

export const getFolderById = async (requestQuery: {
  folderId: string;
}): Promise<FolderRow> => {
  const folder = await db
    .sql<FolderRow>("folder.queries.get_folder_by_id", {
      folderId: requestQuery.folderId,
    })
    .catch((err) => {
      logger.error(err);
      throw new createError.InternalServerError(
        "failed to retrieve featured archives"
      );
    });

  if (folder.rows[0] === undefined) {
    throw new createError.NotFound("Folder not found.");
  }

  return folder.rows[0];
};

export const getFolderByFolderLinkId = async (requestQuery: {
  folderLinkId: string;
}): Promise<FolderRow> => {
  const folder = await db
    .sql<FolderRow>("folder.queries.get_folder_by_folder_link_id", {
      folderLinkId: requestQuery.folderLinkId,
    })
    .catch((err) => {
      logger.error(err);
      throw new createError.InternalServerError("failed to retrieve folder");
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

export const patchFolder = async (
  folderId: string,
  folderData: PatchFolderRequest
): Promise<string> => {
  const columnsForUpdate = requestFieldsToDatabaseFields(folderData, folderId);
  const query = buildPatchQuery(columnsForUpdate);

  const result = await db
    .query<FolderRow>(query, columnsForUpdate)
    .catch((err) => {
      logger.error(err);
      throw new createError.InternalServerError("Failed to update folder");
    });

  if (result.rows[0] === undefined) {
    throw new createError.NotFound("Folder not found");
  }
  return result.rows[0].folderId;
};
