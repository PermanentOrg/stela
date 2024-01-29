import createError from "http-errors";
import { logger } from "@stela/logger";
import { db } from "../database";
import type { Folder } from "./models";
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

export const adminService = {
  recalculateFolderThumbnails,
  setNullAccountSubjects,
};
