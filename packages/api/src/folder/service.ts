import createError from "http-errors";
import { logger } from "@stela/logger";
import { db } from "../database";
import type {
  Folder,
  FolderColumnsForUpdate,
  PatchFolderRequest,
} from "./models";
import { requestFieldsToDatabaseFields } from "./helper";
import { permission } from "../access/permission";
import { folderAccess } from "./access";
import { accountService } from "../account/service";

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
  const folder = await getFolderById({ folderId });
  let canEdit = false;
  let canView = false;
  const accountArchive = await accountService.getAccountArchive(
    folder.archiveId,
    emailFromAuthToken
  );
  if (accountArchive) {
    if (permission.checkCanEditAccountArchive(accountArchive)) {
      canEdit = true;
    }
    if (permission.checkCanViewAccountArchive(accountArchive)) {
      canView = true;
    }
  }
  if (!canEdit) {
    const archiveMemberships =
      await accountService.getCurrentAccountArchiveMemberships(
        emailFromAuthToken
      );
    await Promise.all(
      archiveMemberships.map(async (archiveMembership) => {
        if (permission.checkCanViewAccountArchive(archiveMembership)) {
          canView = true;
        }
        if (permission.checkCanEditAccountArchive(archiveMembership)) {
          const accessList = await folderAccess.getAccessByFolder(
            folderId,
            archiveMembership.archiveId
          );
          if (permission.checkCanView(accessList)) {
            canView = true;
          }
          if (permission.checkCanEdit(accessList)) {
            canEdit = true;
          }
        }
        return archiveMembership;
      })
    );
  }
  if (!canView) {
    throw new createError.NotFound("Folder not found.");
  }
  if (!canEdit) {
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
