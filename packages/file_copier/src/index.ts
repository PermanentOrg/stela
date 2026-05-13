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
	};
};

const generateNewFileCloudPath = (
	originalFileCloudPath: string,
	originalFileId: string,
	newFileId: string,
): string => {
	const originalFileCloudPathWithNewFileIds = originalFileCloudPath.replace(
		new RegExp(`(?<=^|/)${originalFileId}(?=/|$)`, "vg"),
		newFileId,
	);

	// Currently, cloudPaths for original files are in the format "originals/fileId/fileId".
	// This allows us to generate a cloudPath for the copy by simply replacing the original
	// file's ID with the copy's ID everywhere it appears in the cloudPath. However, some
	// older files have cloudPaths of simply "fileId". In those cases, we to generate a cloudPath
	// for the copy in the new format. Since in the previous step we replaced all instances of
	// the original fileId with the copy's fileId, this is usually just a matter of adding
	// "originals/newFileId/" as a prefix. However, in developers' local environments cloudPaths
	// in the old and new formats have a prefix of "_NameOfDeveloper/", so if we're converting an
	// old-format cloudPath to a new-format cloudPath we check such a prefix and include it in the
	// generated cloudPath.
	return originalFileCloudPathWithNewFileIds.includes("originals")
		? originalFileCloudPathWithNewFileIds
		: originalFileCloudPathWithNewFileIds.replace(
				/^(?<localPrefix>.*\/)?/v,
				`$1originals/${newFileId}/`,
			);
};

const getFileUploadName = async (fileId: string): Promise<string> => {
	const newFile = await db
		.sql<{ uploadFileName: string }>("queries.get_file_upload_name", {
			fileId,
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

	return newFile.rows[0].uploadFileName;
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

				const newFileCloudPath = generateNewFileCloudPath(
					originalFileCloudPath,
					originalFileId,
					newFileId,
				);

				await s3Client
					.send(
						new CopyObjectCommand({
							Bucket: process.env["S3_BUCKET"] ?? "",
							CopySource: encodeURI(
								`${process.env["S3_BUCKET"] ?? ""}/${originalFileCloudPath}`,
							),
							Key: newFileCloudPath,
						}),
					)
					.catch((err: unknown) => {
						logger.error(err);
						throw err;
					});

				const cdnExpirationTime = new Date();
				cdnExpirationTime.setFullYear(cdnExpirationTime.getFullYear() + 1);

				const newFileUploadFileName = await getFileUploadName(newFileId);

				await db
					.sql("queries.update_file_and_send_event", {
						newFileId,
						originalFileId,
						eventId,
						cloudPath: newFileCloudPath,
						fileUrl: constructSignedCdnUrl(newFileCloudPath),
						downloadUrl: constructSignedCdnUrl(
							newFileCloudPath,
							newFileUploadFileName,
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
