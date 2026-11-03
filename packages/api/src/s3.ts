import {
	S3Client,
	HeadObjectCommand,
	CopyObjectCommand,
	CreateMultipartUploadCommand,
	UploadPartCopyCommand,
	CompleteMultipartUploadCommand,
	AbortMultipartUploadCommand,
	DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import type { CompletedPart } from "@aws-sdk/client-s3";
import { logger } from "@stela/logger";
import { GB } from "./constants.js";

const MAX_SINGLE_OPERATION_COPY_GB = 5;
const MAX_SINGLE_OPERATION_COPY_BYTES = MAX_SINGLE_OPERATION_COPY_GB * GB;
const MULTIPART_COPY_PART_BYTES = GB;

let s3Client: S3Client | undefined = undefined;

export const getS3Client = (): S3Client => {
	s3Client ??= new S3Client({
		region: process.env["AWS_REGION"] ?? "",
		...(process.env["AWS_ENDPOINT_URL"] === undefined
			? {}
			: {
					endpoint: process.env["AWS_ENDPOINT_URL"],
					forcePathStyle: true,
				}),
	});
	return s3Client;
};

const getBucket = (): string => process.env["S3_BUCKET"] ?? "";

const getCopySource = (key: string): string =>
	encodeURI(`${getBucket()}/${key}`);

const multipartCopyObject = async ({
	sourceKey,
	destinationKey,
	size,
	contentType,
	metadata,
}: {
	sourceKey: string;
	destinationKey: string;
	size: number;
	contentType: string | undefined;
	metadata: Record<string, string> | undefined;
}): Promise<void> => {
	const { UploadId: uploadId } = await getS3Client().send(
		new CreateMultipartUploadCommand({
			Bucket: getBucket(),
			Key: destinationKey,
			ContentType: contentType,
			Metadata: metadata,
		}),
	);
	if (uploadId === undefined) {
		throw new Error(`Failed to start multipart upload for ${destinationKey}`);
	}

	try {
		const partCount = Math.ceil(size / MULTIPART_COPY_PART_BYTES);
		const parts: CompletedPart[] = await Promise.all(
			Array.from({ length: partCount }, async (_, index) => {
				const partNumber = index + 1;
				const firstByte = index * MULTIPART_COPY_PART_BYTES;
				const lastByte = Math.min(
					firstByte + MULTIPART_COPY_PART_BYTES - 1,
					size - 1,
				);
				const { CopyPartResult: copyPartResult } = await getS3Client().send(
					new UploadPartCopyCommand({
						Bucket: getBucket(),
						Key: destinationKey,
						UploadId: uploadId,
						PartNumber: partNumber,
						CopySource: getCopySource(sourceKey),
						CopySourceRange: `bytes=${firstByte}-${lastByte}`,
					}),
				);
				return { ETag: copyPartResult?.ETag, PartNumber: partNumber };
			}),
		);
		await getS3Client().send(
			new CompleteMultipartUploadCommand({
				Bucket: getBucket(),
				Key: destinationKey,
				UploadId: uploadId,
				MultipartUpload: { Parts: parts },
			}),
		);
	} catch (err) {
		await getS3Client()
			.send(
				new AbortMultipartUploadCommand({
					Bucket: getBucket(),
					Key: destinationKey,
					UploadId: uploadId,
				}),
			)
			.catch((abortErr: unknown) => {
				logger.error(abortErr);
			});
		throw err;
	}
};

const copyObject = async (
	sourceKey: string,
	destinationKey: string,
): Promise<void> => {
	const {
		ContentLength: size,
		ContentType: contentType,
		Metadata: metadata,
	} = await getS3Client().send(
		new HeadObjectCommand({ Bucket: getBucket(), Key: sourceKey }),
	);
	if (size === undefined) {
		throw new Error(`Could not determine size of ${sourceKey}`);
	}

	if (size > MAX_SINGLE_OPERATION_COPY_BYTES) {
		await multipartCopyObject({
			sourceKey,
			destinationKey,
			size,
			contentType,
			metadata,
		});
		return;
	}

	await getS3Client().send(
		new CopyObjectCommand({
			Bucket: getBucket(),
			CopySource: getCopySource(sourceKey),
			Key: destinationKey,
		}),
	);
};

const deleteObject = async (key: string): Promise<void> => {
	await getS3Client().send(
		new DeleteObjectCommand({ Bucket: getBucket(), Key: key }),
	);
};

export const s3Service = {
	copyObject,
	deleteObject,
};
