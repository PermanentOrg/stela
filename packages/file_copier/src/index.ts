import type { SQSHandler, SQSEvent, SQSRecord } from "aws-lambda";
import { S3Client, CopyObjectCommand } from "@aws-sdk/client-s3";
import * as Sentry from "@sentry/aws-serverless";
import { constructSignedCdnUrl, validateSqsMessage } from "@stela/s3-utils";
import { logger } from "@stela/logger";
import { validateFileCopyEvent } from "./validator";
import { db } from "./database";

export const extractFileDataFromFileCopyMessage = (
	message: SQSRecord,
): {
	eventId: string;
	originalFileId: string;
	newFileId: string;
	originalFileCloudPath: string;
	newFileCloudPath: string;
} => {
	const { body } = message;
	const parsedBody: unknown = JSON.parse(body);
	if (!validateSqsMessage(parsedBody)) {
		logger.error(`Invalid message body: ${body}`);
		throw new Error("Invalid message body");
	}
	const parsedMessage: unknown = JSON.parse(parsedBody.Message);
	validateFileCopyEvent(parsedMessage);

	return {
		eventId: parsedMessage.id,
		originalFileId: parsedMessage.body.file.fileid.toString(),
		newFileId: parsedMessage.body.newFile.fileid.toString(),
		originalFileCloudPath: parsedMessage.body.file.cloudpath,
		newFileCloudPath: parsedMessage.body.newFile.cloudpath,
	};
};

export const handler: SQSHandler = Sentry.wrapHandler(
	async (event: SQSEvent) => {
		const s3Client = new S3Client({
			region: process.env["AWS_REGION"] ?? "",
		});
		await Promise.all(
			event.Records.map(async (message) => {
				const { eventId, originalFileId, newFileId, originalFileCloudPath } =
					extractFileDataFromFileCopyMessage(message);

				const originalFileCloudPathWithNewFileIds =
					originalFileCloudPath.replaceAll(originalFileId, newFileId);
				const newFileCloudPath = originalFileCloudPathWithNewFileIds.includes(
					"originals",
				)
					? originalFileCloudPathWithNewFileIds
					: originalFileCloudPathWithNewFileIds.replace(
							/^(?<localPrefix>.*\/)?/v,
							`$1originals/${newFileId}/`,
						);

				await s3Client
					.send(
						new CopyObjectCommand({
							Bucket: process.env["S3_BUCKET"] ?? "",
							CopySource: `${process.env["S3_BUCKET"] ?? ""}/${originalFileCloudPath}`,
							Key: newFileCloudPath,
						}),
					)
					.catch((err: unknown) => {
						logger.error(err);
						throw err;
					});

				const newFile = await db
					.sql<{ uploadFileName: string }>("queries.get_file_upload_name", {
						fileId: newFileId,
					})
					.catch((err: unknown) => {
						logger.error(err);
						throw err;
					});
				if (newFile.rows[0] === undefined) {
					const errorMessage = "Failed to look up new file";
					logger.error(errorMessage);
					throw new Error(errorMessage);
				}

				const cdnExpirationTime = new Date();
				cdnExpirationTime.setFullYear(cdnExpirationTime.getFullYear() + 1);

				await db
					.sql("queries.update_file_and_send_event", {
						newFileId,
						originalFileId,
						eventId,
						cloudPath: newFileCloudPath,
						fileUrl: constructSignedCdnUrl(newFileCloudPath),
						downloadUrl: constructSignedCdnUrl(
							newFileCloudPath,
							newFile.rows[0].uploadFileName,
						),
						urlExpirationTimestamp: cdnExpirationTime.toISOString(),
						env: process.env["ENV"] ?? "local",
					})
					.catch((err: unknown) => {
						logger.error(err);
						throw err;
					});
			}),
		);
	},
);
