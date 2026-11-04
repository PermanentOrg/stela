import type { SQSHandler, SQSEvent, SQSRecord } from "aws-lambda";
import {
	S3Client,
	GetObjectCommand,
	PutObjectCommand,
} from "@aws-sdk/client-s3";
import * as Sentry from "@sentry/aws-serverless";
import sharp from "sharp";
import { constructSignedCdnUrl, validateSqsMessage } from "@stela/s3-utils";
import { validateRecordSubmitEvent } from "@stela/event_utils";
import { logger } from "@stela/logger";
import { db } from "./database.js";
import { isHevcHeif, loadHeic } from "./heic.js";

export const MAX_SOURCE_FILE_SIZE_BYTES = 209_715_200;
export const THUMBNAIL_WIDTH = 256;
const IMAGE_RECORD_TYPE = "type.record.image";

interface OriginalFile {
	recordType: string | null;
	existingThumbnail: string | null;
	fileId: string;
	cloudPath: string | null;
	size: string | null;
}

export const extractRecordIdFromRecordEventMessage = (
	message: SQSRecord,
): string => {
	const { body } = message;
	const parsedBody: unknown = JSON.parse(body);
	if (!validateSqsMessage(parsedBody)) {
		logger.error(`Invalid message body: ${body}`);
		throw new Error("Invalid message body");
	}
	const parsedMessage: unknown = JSON.parse(parsedBody.Message);
	if (!validateRecordSubmitEvent(parsedMessage)) {
		logger.error(`Invalid message: ${parsedBody.Message}`);
		throw new Error("Invalid message");
	}

	const { action } = parsedMessage;
	if (action === "create") {
		if (parsedMessage.body.record === undefined) {
			logger.error(
				`record.create event missing record: ${JSON.stringify(parsedMessage.body)}`,
			);
			throw new Error("record field missing in body of record.create");
		}
		return parsedMessage.body.record.recordId;
	}
	if (action === "copy") {
		if (parsedMessage.body.newRecord === undefined) {
			logger.error(
				`record.copy event missing newRecord: ${JSON.stringify(parsedMessage.body)}`,
			);
			throw new Error("newRecord field missing in body of record.copy");
		}
		return parsedMessage.body.newRecord.recordId;
	}
	throw new Error(`Unsupported action type: ${action}`);
};

// Original files live at "originals/{fileId}/{fileId}" (or just "{fileId}" for older files),
// but in developers' local environments cloudPaths are prefixed with "_NameOfDeveloper/". We
// keep that prefix so local thumbnails stay alongside the developer's other files.
export const generateThumbnailCloudPath = (
	originalCloudPath: string,
	fileId: string,
): string => {
	const localPrefix = /^(?<prefix>_[^\/]+\/)/v.exec(originalCloudPath)
		?.groups?.["prefix"];
	return `${localPrefix ?? ""}thumbnails/${fileId}/${THUMBNAIL_WIDTH}.jpg`;
};

const getOriginalFile = async (
	recordId: string,
): Promise<OriginalFile | undefined> => {
	const result = await db
		.sql<OriginalFile>("queries.get_original_file", { recordId })
		.catch((err: unknown) => {
			logger.error(err);
			throw err;
		});
	return result.rows[0];
};

const downloadOriginal = async (
	s3Client: S3Client,
	cloudPath: string,
): Promise<Uint8Array> => {
	const response = await s3Client
		.send(
			new GetObjectCommand({
				Bucket: process.env["S3_BUCKET"] ?? "",
				Key: cloudPath,
			}),
		)
		.catch((err: unknown) => {
			logger.error(err);
			throw err;
		});
	if (response.Body === undefined) {
		const message = `Empty S3 response body for ${cloudPath}`;
		logger.error(message);
		throw new Error(message);
	}
	return await response.Body.transformToByteArray();
};

const resizeImage = async (
	image: Uint8Array,
	recordId: string,
): Promise<Buffer | undefined> => {
	try {
		const decodedImage = isHevcHeif(image)
			? await loadHeic(image)
			: sharp(image);
		return await decodedImage
			.rotate()
			.resize({ width: THUMBNAIL_WIDTH, withoutEnlargement: true })
			.jpeg()
			.toBuffer();
	} catch (err: unknown) {
		logger.warn(`Failed to generate thumbnail for record ${recordId}`);
		logger.warn(err);
		Sentry.captureException(err);
		return undefined;
	}
};

const generateThumbnailForRecord = async (
	s3Client: S3Client,
	recordId: string,
): Promise<void> => {
	const originalFile = await getOriginalFile(recordId);
	if (
		originalFile?.cloudPath === undefined ||
		originalFile.cloudPath === null ||
		originalFile.size === null
	) {
		const message = `Original file not found for record ${recordId}`;
		logger.error(message);
		Sentry.captureMessage(message);
		return;
	}
	if (originalFile.recordType !== IMAGE_RECORD_TYPE) {
		return;
	}
	if (originalFile.existingThumbnail !== null) {
		return;
	}
	if (Number(originalFile.size) > MAX_SOURCE_FILE_SIZE_BYTES) {
		return;
	}

	const original = await downloadOriginal(s3Client, originalFile.cloudPath);
	const thumbnail = await resizeImage(original, recordId);
	if (thumbnail === undefined) {
		return;
	}

	const thumbnailCloudPath = generateThumbnailCloudPath(
		originalFile.cloudPath,
		originalFile.fileId,
	);
	await s3Client
		.send(
			new PutObjectCommand({
				Bucket: process.env["S3_BUCKET"] ?? "",
				Key: thumbnailCloudPath,
				Body: thumbnail,
				ContentType: "image/jpeg",
			}),
		)
		.catch((err: unknown) => {
			logger.error(err);
			throw err;
		});

	await db
		.sql("queries.update_record_thumbnail", {
			recordId,
			thumbnailUrl: constructSignedCdnUrl(thumbnailCloudPath),
			thumbnailCloudPath,
		})
		.catch((err: unknown) => {
			logger.error(err);
			throw err;
		});
};

export const handler: SQSHandler = Sentry.wrapHandler(
	async (event: SQSEvent) => {
		const s3Client = new S3Client({
			region: process.env["AWS_REGION"] ?? "",
		});
		await Promise.all(
			event.Records.map(async (message) => {
				const recordId = extractRecordIdFromRecordEventMessage(message);
				await generateThumbnailForRecord(s3Client, recordId);
			}),
		);
	},
);
