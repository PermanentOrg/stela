import type { SQSHandler, SQSEvent } from "aws-lambda";
import { lookup as mimeLookup } from "mime-types";
import * as path from "node:path";
import { TinyPgError } from "tinypg";
import * as Sentry from "@sentry/aws-serverless";
import {
	constructSignedCdnUrl,
	getS3ObjectFromS3Message,
} from "@stela/s3-utils";
import { getOriginalFileIdFromInformationPackagePath } from "@stela/archivematica-utils";
import {
	UnrecognizedExtensionMIMEType,
	PermanentTypeByFileExtension,
	UnrecognizedExtensionPermanentType,
} from "@stela/file-utils";
import { logger } from "@stela/logger";
import { db } from "./database";

const duplicateArchivematicaFileError =
	'duplicate key value violates unique constraint "unique_parent_file_id_format"';

export const handler: SQSHandler = Sentry.wrapHandler(
	async (event: SQSEvent, _, __) => {
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

				const type =
					// slice the leading . off the file extension
					PermanentTypeByFileExtension[fileExtension.slice(1)] ??
					UnrecognizedExtensionPermanentType;

				await db
					.sql("queries.insert_file", {
						size: s3Object.size,
						format: "file.format.archivematica.access",
						parentFileId,
						contentType:
							mimeLookup(fileExtension) !== false
								? mimeLookup(fileExtension)
								: UnrecognizedExtensionMIMEType,
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
