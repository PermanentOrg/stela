import type { SQSHandler, SQSEvent } from "aws-lambda";
import { lookup as mimeLookup } from "mime-types";
import * as path from "node:path";
import { TinyPgError } from "tinypg";
import * as Sentry from "@sentry/aws-serverless";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import {
	constructSignedCdnUrl,
	getS3ObjectFromS3Message,
	getS3BucketFromS3Message,
} from "@stela/s3-utils";
import { getOriginalFileIdFromInformationPackagePath } from "@stela/archivematica-utils";
import {
	UnrecognizedExtensionMIMEType,
	PermanentTypeByFileExtension,
	UnrecognizedExtensionPermanentType,
} from "@stela/file-utils";
import { logger } from "@stela/logger";
import { db } from "./database";
import { Readable } from "node:stream";
import { detectFileType } from "./file-type-utils";

const duplicateArchivematicaFileError =
	'duplicate key value violates unique constraint "unique_parent_file_id_format"';

const removeFirstCharacter = (str: string): string => {
	const secondCharacterIndex = 1;
	return str.slice(secondCharacterIndex);
};

const getFileType = async (
	fileExtension: string,
	s3BucketName: string,
	key: string,
): Promise<string> => {
	let type =
		PermanentTypeByFileExtension[removeFirstCharacter(fileExtension)] ??
		UnrecognizedExtensionPermanentType;

	if (type === UnrecognizedExtensionPermanentType) {
		const s3Client = new S3Client({
			region: process.env["AWS_REGION"] ?? "",
		});
		const accessCopyResponse = await s3Client.send(
			new GetObjectCommand({ Bucket: s3BucketName, Key: key }),
		);
		if (accessCopyResponse.Body instanceof Readable) {
			const detectedFileType = await detectFileType(accessCopyResponse.Body);
			type =
				detectedFileType?.ext === undefined
					? UnrecognizedExtensionPermanentType
					: (PermanentTypeByFileExtension[detectedFileType.ext] ??
						UnrecognizedExtensionPermanentType);
		}
	}

	return type;
};

export const handler: SQSHandler = Sentry.wrapHandler(
	async (event: SQSEvent) => {
		await Promise.all(
			event.Records.map(async (message) => {
				const s3Object = getS3ObjectFromS3Message(message);
				const { key } = s3Object;
				if (!key.includes("/objects/")) {
					// If we don't have "objects" in the key, this is the thumbnail, so irrelevant to this lambda
					return;
				}

				const parentFileId = getOriginalFileIdFromInformationPackagePath(key);
				const fileExtension = path.extname(key);

				const parentFile = await db
					.sql<{ archiveId: string; uploadFileName: string; recordId: string }>(
						"queries.get_file",
						{
							fileId: parentFileId,
						},
					)
					.catch((err: unknown) => {
						logger.error(err);
						throw err;
					});
				if (parentFile.rows[0] === undefined) {
					const errorMessage = "Failed to look up parent file";
					logger.error(errorMessage);
					throw new Error(errorMessage);
				}

				const cdnExpirationTime = new Date();
				cdnExpirationTime.setFullYear(cdnExpirationTime.getFullYear() + 1);

				const s3Bucket = getS3BucketFromS3Message(message);
				const type = await getFileType(fileExtension, s3Bucket.name, key);

				await db
					.sql("queries.insert_file", {
						size: s3Object.size,
						format: "file.format.archivematica.access",
						parentFileId,
						contentType:
							mimeLookup(fileExtension) === false
								? UnrecognizedExtensionMIMEType
								: mimeLookup(fileExtension),
						s3VersionId: s3Object.versionId,
						cloud1: process.env["S3_BUCKET"],
						cloud2: process.env["S3_BUCKET"],
						cloud3: process.env["BACKBLAZE_BUCKET"],
						archiveId: parentFile.rows[0].archiveId,
						fileUrl: constructSignedCdnUrl(key),
						downloadUrl: constructSignedCdnUrl(
							key,
							`${path.basename(
								parentFile.rows[0].uploadFileName,
								path.extname(parentFile.rows[0].uploadFileName),
							)}${fileExtension}`,
						),
						urlExpiration: cdnExpirationTime.toISOString(),
						status: "status.generic.ok",
						type,
						cloudPath: key,
						recordId: parentFile.rows[0].recordId,
					})
					.catch((err: unknown) => {
						if (
							!(
								err instanceof TinyPgError &&
								err.message === duplicateArchivematicaFileError
							)
						) {
							logger.error(err);
							throw err;
						}
						// Otherwise, we're dealing with a duplicate message, so we don't need to do anything
					});
			}),
		);
	},
);
