import type { SQSHandler, SQSEvent, SQSRecord } from "aws-lambda";
import * as Sentry from "@sentry/aws-serverless";
import { constructSignedCdnUrl } from "@stela/s3-utils";
import { logger } from "@stela/logger";
import { db } from "./database";
import {
  validateNewDisseminationPackageJpgEvent,
  validateSqsMessage,
} from "./validators";

const getKeyFromS3Message = (message: SQSRecord): string => {
  const { body } = message;
  const parsedBody: unknown = JSON.parse(body);
  if (!validateSqsMessage(parsedBody)) {
    logger.error(
      `Invalid message body: ${JSON.stringify(validateSqsMessage.errors)}`
    );
    throw new Error("Invalid message body");
  }
  const parsedMessage: unknown = JSON.parse(parsedBody.Message);
  if (
    !validateNewDisseminationPackageJpgEvent(parsedMessage) ||
    !parsedMessage.Records[0]
  ) {
    logger.error(
      `Invalid message body: ${JSON.stringify(
        validateNewDisseminationPackageJpgEvent.errors
      )}`
    );
    throw new Error("Invalid message body");
  }

  const { key } = parsedMessage.Records[0].s3.object;
  return key;
};

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
        const key = getKeyFromS3Message(message);
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
