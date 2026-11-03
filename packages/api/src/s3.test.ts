import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
	HeadObjectCommand,
	CopyObjectCommand,
	CreateMultipartUploadCommand,
	UploadPartCopyCommand,
	CompleteMultipartUploadCommand,
	AbortMultipartUploadCommand,
	DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { logger } from "@stela/logger";
import { getS3Client, s3Service } from "./s3.js";
import { GB } from "./constants.js";

vi.mock("@stela/logger");
vi.stubEnv("AWS_REGION", "us-west-2");

const mockS3Send = vi.fn();

const getSentCommandsOfType = (
	commandType: abstract new (...args: never[]) => { input: unknown },
): unknown[] =>
	mockS3Send.mock.calls
		.map((args: unknown[]) => args[0])
		.filter((command) => command instanceof commandType)
		.map((command) => command.input);

type CommandType = abstract new (...args: never[]) => unknown;

const mockS3 = ({
	objectSize,
	failures = [],
	omitUploadId = false,
}: {
	objectSize: number | undefined;
	failures?: Array<[CommandType, Error]>;
	omitUploadId?: boolean;
}): void => {
	mockS3Send.mockReset();
	vi.spyOn(getS3Client(), "send").mockImplementation(mockS3Send);
	mockS3Send.mockImplementation(async (command: unknown) => {
		const failure = failures.find(
			([failingCommand]) => command instanceof failingCommand,
		);
		if (failure !== undefined) {
			throw failure[1];
		}
		if (command instanceof HeadObjectCommand) {
			return {
				ContentLength: objectSize,
				ContentType: "image/jpeg",
				Metadata: { foo: "bar" },
			};
		}
		if (command instanceof CreateMultipartUploadCommand) {
			return omitUploadId ? {} : { UploadId: "upload-id" };
		}
		if (command instanceof UploadPartCopyCommand) {
			return {
				CopyPartResult: { ETag: `etag-${command.input.PartNumber}` },
			};
		}
		return {};
	});
};

describe("s3Service.copyObject", () => {
	beforeEach(() => {
		vi.stubEnv("S3_BUCKET", "test-bucket");
	});

	afterEach(() => {
		vi.unstubAllEnvs();
		vi.restoreAllMocks();
	});

	test("should copy small objects with a single CopyObject call", async () => {
		mockS3({ objectSize: GB });

		await s3Service.copyObject("_Liam/1", "_Liam/originals/1/1");

		expect(getSentCommandsOfType(CopyObjectCommand)).toEqual([
			{
				Bucket: "test-bucket",
				CopySource: "test-bucket/_Liam/1",
				Key: "_Liam/originals/1/1",
			},
		]);
		expect(getSentCommandsOfType(CreateMultipartUploadCommand)).toEqual([]);
	});

	test("should copy objects of exactly 5 GiB with a single CopyObject call", async () => {
		mockS3({ objectSize: 5 * GB });

		await s3Service.copyObject("1", "originals/1/1");

		expect(getSentCommandsOfType(CopyObjectCommand)).toHaveLength(1);
		expect(getSentCommandsOfType(CreateMultipartUploadCommand)).toEqual([]);
	});

	test("should copy objects over 5 GiB with a multipart upload", async () => {
		const size = 5 * GB + 10;
		mockS3({ objectSize: size });

		await s3Service.copyObject("1", "originals/1/1");

		expect(getSentCommandsOfType(CopyObjectCommand)).toEqual([]);
		expect(getSentCommandsOfType(CreateMultipartUploadCommand)).toEqual([
			{
				Bucket: "test-bucket",
				Key: "originals/1/1",
				ContentType: "image/jpeg",
				Metadata: { foo: "bar" },
			},
		]);
		const partCopies = getSentCommandsOfType(UploadPartCopyCommand);
		expect(partCopies).toHaveLength(6);
		expect(partCopies[0]).toEqual({
			Bucket: "test-bucket",
			Key: "originals/1/1",
			UploadId: "upload-id",
			PartNumber: 1,
			CopySource: "test-bucket/1",
			CopySourceRange: `bytes=0-${GB - 1}`,
		});
		expect(partCopies[5]).toEqual(
			expect.objectContaining({
				PartNumber: 6,
				CopySourceRange: `bytes=${5 * GB}-${size - 1}`,
			}),
		);
		expect(getSentCommandsOfType(CompleteMultipartUploadCommand)).toEqual([
			{
				Bucket: "test-bucket",
				Key: "originals/1/1",
				UploadId: "upload-id",
				MultipartUpload: {
					Parts: [1, 2, 3, 4, 5, 6].map((partNumber) => ({
						ETag: `etag-${partNumber}`,
						PartNumber: partNumber,
					})),
				},
			},
		]);
	});

	test("should abort the multipart upload if a part fails to copy", async () => {
		mockS3({
			objectSize: 6 * GB,
			failures: [[UploadPartCopyCommand, new Error("S3 failure")]],
		});

		await expect(s3Service.copyObject("1", "originals/1/1")).rejects.toThrow(
			"S3 failure",
		);

		expect(getSentCommandsOfType(AbortMultipartUploadCommand)).toEqual([
			{ Bucket: "test-bucket", Key: "originals/1/1", UploadId: "upload-id" },
		]);
		expect(getSentCommandsOfType(CompleteMultipartUploadCommand)).toEqual([]);
	});

	test("should throw if the source object can't be found", async () => {
		mockS3({
			objectSize: GB,
			failures: [[HeadObjectCommand, new Error("S3 failure")]],
		});

		await expect(s3Service.copyObject("1", "originals/1/1")).rejects.toThrow(
			"S3 failure",
		);
		expect(getSentCommandsOfType(CopyObjectCommand)).toEqual([]);
	});

	test("should throw if S3 doesn't report the source object's size", async () => {
		mockS3({ objectSize: undefined });

		await expect(s3Service.copyObject("1", "originals/1/1")).rejects.toThrow(
			"Could not determine size of 1",
		);
		expect(getSentCommandsOfType(CopyObjectCommand)).toEqual([]);
		expect(getSentCommandsOfType(CreateMultipartUploadCommand)).toEqual([]);
	});

	test("should throw if S3 doesn't return an ID for the multipart upload", async () => {
		mockS3({ objectSize: 6 * GB, omitUploadId: true });

		await expect(s3Service.copyObject("1", "originals/1/1")).rejects.toThrow(
			"Failed to start multipart upload for originals/1/1",
		);
		expect(getSentCommandsOfType(UploadPartCopyCommand)).toEqual([]);
		expect(getSentCommandsOfType(CompleteMultipartUploadCommand)).toEqual([]);
	});

	test("should log the abort error and rethrow the original error if aborting a failed multipart upload also fails", async () => {
		const partCopyError = new Error("Part copy failure");
		const abortError = new Error("Abort failure");
		mockS3({
			objectSize: 6 * GB,
			failures: [
				[UploadPartCopyCommand, partCopyError],
				[AbortMultipartUploadCommand, abortError],
			],
		});

		await expect(s3Service.copyObject("1", "originals/1/1")).rejects.toBe(
			partCopyError,
		);
		expect(getSentCommandsOfType(AbortMultipartUploadCommand)).toHaveLength(1);
		expect(logger.error).toHaveBeenCalledWith(abortError);
	});
});

describe("s3Service.deleteObject", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
		vi.restoreAllMocks();
	});

	test("should delete the object", async () => {
		vi.stubEnv("S3_BUCKET", "test-bucket");
		mockS3({ objectSize: GB });

		await s3Service.deleteObject("1");

		expect(getSentCommandsOfType(DeleteObjectCommand)).toEqual([
			{ Bucket: "test-bucket", Key: "1" },
		]);
	});
});
