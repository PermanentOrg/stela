import createError from "http-errors";
import { logger } from "@stela/logger";
import { db } from "../database";
import type {
  Folder,
  FolderColumnsForUpdate,
  FolderLink,
  PatchFolderRequest,
} from "./models";
import { requestFieldsToDatabaseFields } from "./helper";
import type { GetAccountArchiveResult } from "../account/models";
import { accessService } from "../access/service";
import { permission } from "../access/permission";

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

export const getFolderLinkByFolderId = async (requestQuery: {
  folderId: string;
}): Promise<FolderLink> => {
  const folder = await db
    .sql<FolderLink>("folder.queries.get_folder_link_by_folder_id", {
      folderId: requestQuery.folderId,
    })
    .catch((err) => {
      logger.error(err);
      throw new createError.InternalServerError(
        "Failed to retrieve folder link"
      );
    });

  if (folder.rows[0] === undefined) {
    throw new createError.NotFound("Folder link not found.");
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
  const folder = await getFolderById({
    folderId,
  });
  const accountArchiveResult = await db
    .sql<GetAccountArchiveResult>("account.queries.get_account_archive", {
      archiveId: folder.archiveId,
      email: emailFromAuthToken,
    })
    .catch((err) => {
      logger.error(err);
      throw new createError.InternalServerError(
        "Failed to retrieve account archive"
      );
    });
  const accountArchive = accountArchiveResult.rows[0];
  if (!accountArchive) {
    // ??? How do I make sure I get the correct folder link id?
    const folderLink = await getFolderLinkByFolderId({ folderId });
    const accessList = await accessService.getAccess(folderLink.folderLinkId);
    if (!(await permission.checkCanEdit(accessList))) {
      throw new createError.Forbidden(
        "User does not have permission to modify folder"
      );
    }
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
