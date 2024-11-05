import type { SQSHandler, SQSEvent } from "aws-lambda";
import * as Sentry from "@sentry/aws-serverless";
import {
  constructSignedCdnUrl,
  getS3ObjectFromS3Message,
} from "@stela/s3-utils";
import { logger } from "@stela/logger";
import { db } from "./database";

const getFileIdFromKey = (key: string): string => {
  // The key will inlude the substring /{fileId}_upload, which is what this regex looks for. The fileId is either
  // numeric or a UUID, so we expect it to consist of some hexadecimal digits and hyphens.
  const fileIdRegex = /\/([0-9abcdef-]*)_upload/;
  const match = fileIdRegex.exec(key);
  if (match === null || match[1] === undefined) {
    logger.error(`Invalid file key: ${key}`);
    throw new Error("Invalid file key");
  }
  return match[1];
};

export const handler: SQSHandler = Sentry.wrapHandler(
  async (event: SQSEvent, _, __) => {
    await Promise.all(
      event.Records.map(async (message) => {
        const { key } = getS3ObjectFromS3Message(message);
        if (!key.includes("/thumbnails/")) {
          // If we don't have "thumbnails" in the key, this is the access copy, so irrelevant to this lambda
          return;
        }

        const fileId = getFileIdFromKey(key);
        const thumbnailUrl = constructSignedCdnUrl(key);

        try {
          await db.sql("queries.update_record_thumbnail_data", {
            fileId,
            thumbnailUrl,
            thumbnail256CloudPath: key,
          });
        } catch (error) {
          logger.error(error);
          throw error;
        }
      })
    );
  }
);
