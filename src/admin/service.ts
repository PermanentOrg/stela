import createError from "http-errors";
import { db } from "../database";
import type { Folder } from "./models";
import { publisherClient, lowPriorityTopicArn } from "../publisher_client";
import { logger } from "../log";

const recalculateFolderThumbnails = async (
  cutoffTimestamp: Date
): Promise<{ messagesSent: number; failedFolders: string[] }> => {
  const folderResult = await db
    .sql<Folder>("admin.queries.get_folders_created_before_timestamp", {
      cutoffTimestamp,
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

export const adminService = {
  recalculateFolderThumbnails,
};
