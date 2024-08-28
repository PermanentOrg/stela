import type { SQSHandler, SQSEvent, SQSRecord } from "aws-lambda";
import { getSignedUrl } from "aws-cloudfront-sign";
import * as Sentry from "@sentry/aws-serverless";
import { logger } from "@stela/logger";
import { db } from "./database";
import { validateNewDisseminationPackageJpgEvent } from "./validators";

const getKeyFromS3Message = (message: SQSRecord): string => {
  const { body } = message;
  const parsedBody: unknown = JSON.parse(body);
  if (!validateNewDisseminationPackageJpgEvent(parsedBody)) {
    logger.error(
      `Invalid message body: ${JSON.stringify(
        validateNewDisseminationPackageJpgEvent.errors
      )}`
    );
    throw new Error("Invalid message body");
  }

  const { key } = parsedBody.s3.object;
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

const constructSignedCdnUrl = (key: string): string => {
  const expirationTime = new Date();
  expirationTime.setFullYear(expirationTime.getFullYear() + 1);

  return getSignedUrl(`${process.env["CLOUDFRONT_URL"] ?? ""}${key}`, {
    expireTime: expirationTime.getTime(),
    keypairId: process.env["CLOUDFRONT_KEY_PAIR_ID"] ?? "",
    privateKeyString: process.env["CLOUDFRONT_PRIVATE_KEY"] ?? "",
  });
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
