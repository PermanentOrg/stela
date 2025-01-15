import createError from "http-errors";
import { logger } from "@stela/logger";
import { db } from "../database";
import type { Folder, ArchiveRecord } from "./models";
import { publisherClient, lowPriorityTopicArn } from "../publisher_client";

const recalculateFolderThumbnails = async (
  beginTimestamp: Date,
  endTimestamp: Date
): Promise<{ messagesSent: number; failedFolders: string[] }> => {
  const folderResult = await db
    .sql<Folder>("admin.queries.get_folders_created_before_timestamp", {
      beginTimestamp,
      endTimestamp,
    })
    .catch((err) => {
      logger.error(err);
      throw new createError.InternalServerError("Failed to retrieve folders");
    });
  const folders = folderResult.rows;

  const publishResults = await publisherClient
    .batchPublishMessages(
      lowPriorityTopicArn,
      folders.map((folder) => ({
        id: folder.folderId,
        body: JSON.stringify({
          task: "task.thumbnail.folder",
          parameters: [
            "Thumbnail_Redo",
            folder.folderId,
            0,
            folder.archiveId,
            0,
            new Date().toISOString(),
          ],
        }),
      }))
    )
    .catch((err) => {
      logger.error(err);
      throw new createError.InternalServerError("Failed to publish messages");
    });

  return {
    messagesSent: publishResults.messagesSent,
    failedFolders: publishResults.failedMessages,
  };
};

const recalculateRecordThumbnail = async (recordId: string): Promise<void> => {
  const recordResult = await db
    .sql<ArchiveRecord>("admin.queries.get_record", {
      recordId,
    })
    .catch((err) => {
      logger.error(err);
      throw new createError.InternalServerError("Failed to retrieve record");
    });

  if (!recordResult.rows[0]) {
    throw new createError.NotFound("Record not found");
  }

  const publishResult = await publisherClient.batchPublishMessages(
    lowPriorityTopicArn,
    [
      {
        id: recordId,
        body: JSON.stringify({
          task: "task.thumbnail.record",
          parameters: [
            "Thumbnail_Redo",
            recordId,
            recordResult.rows[0].parentFolderId,
            recordResult.rows[0].archiveId,
            0,
            new Date().toISOString(),
          ],
        }),
      },
    ]
  );

  if (publishResult.failedMessages.length > 0) {
    throw new createError.InternalServerError("Failed to publish message");
  }
};

const setNullAccountSubjects = async (
  accounts: {
    email: string;
    subject: string;
  }[]
): Promise<{ updatedAccounts: string[]; emailsWithErrors: string[] }> => {
  const updatedAccounts: string[] = [];
  const emailsWithErrors: string[] = [];
  await Promise.all(
    accounts.map(async (account) => {
      const result = await db
        .sql<{ accountId: string }>("admin.queries.set_null_account_subject", {
          email: account.email,
          subject: account.subject,
        })
        .catch((err) => {
          logger.error(err);
          emailsWithErrors.push(account.email);
          return null;
        });
      if (result?.rows[0]) {
        updatedAccounts.push(result.rows[0].accountId);
      }
    })
  );

  return {
    updatedAccounts,
    emailsWithErrors,
  };
};

const triggerOrphanedFolderDeletion = async (): Promise<{
  messagesSent: number;
  folderIdsWithErrors: string[];
}> => {
  const folderResult = await db
    .sql<{
      folderId: string;
      archiveNumber: string;
      archiveId: number;
      folderLinkId: number;
    }>("admin.queries.get_orphaned_folders")
    .catch((err) => {
      logger.error(err);
      throw new createError.InternalServerError("Failed to retrieve folders");
    });

  const folders = folderResult.rows;

  const publishResults = await publisherClient
    .batchPublishMessages(
      lowPriorityTopicArn,
      folders.map((folder) => ({
        id: folder.folderId,
        body: JSON.stringify({
          task: "task.folder.delete.all",
          parameters: [
            "Folder_Delete_ALL",
            folder.archiveNumber,
            folder.archiveId,
            folder.folderLinkId,
          ],
        }),
      }))
    )
    .catch((err) => {
      logger.error(err);
      throw new createError.InternalServerError("Failed to publish messages");
    });

  return {
    messagesSent: publishResults.messagesSent,
    folderIdsWithErrors: publishResults.failedMessages,
  };
};

export const adminService = {
  recalculateFolderThumbnails,
  recalculateRecordThumbnail,
  setNullAccountSubjects,
  triggerOrphanedFolderDeletion,
};
