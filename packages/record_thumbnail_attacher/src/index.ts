import type { SQSHandler, SQSEvent } from "aws-lambda";
import * as Sentry from "@sentry/aws-serverless";
import {
	constructSignedCdnUrl,
	getS3ObjectFromS3Message,
} from "@stela/s3-utils";
import { getOriginalFileIdFromInformationPackagePath } from "@stela/archivematica-utils";
import { logger } from "@stela/logger";
import { db } from "./database";

export const handler: SQSHandler = Sentry.wrapHandler(
	async (event: SQSEvent, _, __) => {
		await Promise.all(
			event.Records.map(async (message) => {
				const { key } = getS3ObjectFromS3Message(message);
				if (!key.includes("/thumbnails/")) {
					// If we don't have "thumbnails" in the key, this is the access copy, so irrelevant to this lambda
					return;
				}

				const fileId = getOriginalFileIdFromInformationPackagePath(key);
				const thumbnailUrl = constructSignedCdnUrl(key);

				try {
					const result = await db.sql("queries.update_record_thumbnail_data", {
						fileId,
						thumbnailUrl,
						thumbnail256CloudPath: key,
					});
					if (result.rows.length === 0) {
						logger.error(`Failed to updated record for file: ${fileId}`);
					}
				} catch (error) {
					logger.error(error);
					throw error;
				}
			}),
		);
	},
);
