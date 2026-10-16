import { getSignedUrl } from "aws-cloudfront-sign";
import { describe, expect, test, vi } from "vitest";
import {
	buildContentDisposition,
	constructSignedCdnUrl,
	getS3ObjectFromS3Message,
	getS3BucketFromS3Message,
} from "./index.js";

vi.mock("aws-cloudfront-sign");

describe("constructSignedCDNURL", () => {
	test("calls getSignedUrl correctly when no fileName is provided", () => {
		const mockCloudfrontUrl = "https://test.permanent.org/";
		process.env["CLOUDFRONT_URL"] = mockCloudfrontUrl;
		const testKey = "test-key";
		constructSignedCdnUrl(testKey);

		expect(getSignedUrl).toHaveBeenCalledWith(
			`${mockCloudfrontUrl}${testKey}`,
			expect.anything(),
		);
	});

	test("calls getSignedUrl correctly when fileName is provided", () => {
		const mockCloudfrontUrl = "https://test.permanent.org/";
		process.env["CLOUDFRONT_URL"] = mockCloudfrontUrl;
		const testKey = "test-key";
		const testFileName = "test-file.txt";
		constructSignedCdnUrl(testKey, testFileName);

		// The disposition must reach S3 as a full RFC 6266 header value, not a
		// bare filename — without a `filename` parameter browsers fall back to
		// the last path segment of the URL, which is the file ID.
		const expectedUrl = new URL(`${mockCloudfrontUrl}${testKey}`);
		expectedUrl.searchParams.append(
			"response-content-disposition",
			`attachment; filename="${testFileName}"`,
		);

		expect(getSignedUrl).toHaveBeenCalledWith(
			expectedUrl.toString(),
			expect.anything(),
		);
	});
});

describe("buildContentDisposition", () => {
	test("wraps a plain ASCII name in a simple disposition", () => {
		expect(buildContentDisposition("report.pdf")).toBe(
			'attachment; filename="report.pdf"',
		);
	});

	test("leaves a name containing spaces unchanged", () => {
		expect(buildContentDisposition("my report.pdf")).toBe(
			'attachment; filename="my report.pdf"',
		);
	});

	test("uses the extended parameter for a non-Latin name", () => {
		const fileName = "Контракт.pdf";
		const disposition = buildContentDisposition(fileName);

		// Each non-ASCII code point becomes one underscore, preserving the
		// extension.
		expect(disposition).toContain('filename="________.pdf"');
		expect(disposition).toContain(
			"filename*=UTF-8''%D0%9A%D0%BE%D0%BD%D1%82%D1%80%D0%B0%D0%BA%D1%82.pdf",
		);
		// The whole value must be representable in ISO-8859-1, i.e. carry no
		// raw multibyte characters, or S3 rejects the override.
		expect(disposition).toMatch(/^[\x20-\x7e]*$/v);
	});

	test("neutralises quotes and backslashes", () => {
		// Either would otherwise terminate or escape the quoted-string and
		// corrupt the header.
		expect(buildContentDisposition('a"b\\c.txt')).toContain(
			'filename="a_b_c.txt"',
		);
	});

	test("percent-encodes characters outside the RFC 5987 attr-char set", () => {
		const disposition = buildContentDisposition("(«quoted»).txt");

		expect(disposition).toContain("%28");
		expect(disposition).toContain("%29");
		expect(disposition).not.toMatch(/filename\*=UTF-8''[^;]*[\(\)]/v);
	});
});

describe("getS3ObjectFromS3Message", () => {
	test("should extract the S3 object from a well-formed message", () => {
		const expectedKey =
			"_Liam/access_copies/b38e/8582/b417/430c/953d/5c7e/8040/1ae2/2_upload-cb45fa84-f0ea-4a9e-b1da-309e485a4f4a/object/710a1def-caf8-48f2-8eee-0848b4cfda10.jpg";
		const expectedSize = 102400;
		const expectedVersionId = "test-s3-version-id";

		const s3Object = getS3ObjectFromS3Message({
			messageId: "1",
			receiptHandle: "1",
			body: JSON.stringify({
				Message: JSON.stringify({
					Records: [
						{
							s3: {
								bucket: {
									name: "test-bucket",
								},
								object: {
									key: expectedKey,
									size: expectedSize,
									versionId: expectedVersionId,
								},
							},
						},
					],
				}),
			}),
			attributes: {
				ApproximateReceiveCount: "1",
				SentTimestamp: "1",
				SenderId: "1",
				ApproximateFirstReceiveTimestamp: "1",
			},
			messageAttributes: {},
			md5OfBody: "1",
			eventSource: "1",
			eventSourceARN: "1",
			awsRegion: "1",
		});

		expect(s3Object.key).toEqual(expectedKey);
		expect(s3Object.size).toEqual(expectedSize);
		expect(s3Object.versionId).toEqual(expectedVersionId);
	});

	test("should throw an error if the SQSRecord body is the wrong format", () => {
		let error = null;
		try {
			getS3ObjectFromS3Message({
				messageId: "1",
				receiptHandle: "1",
				body: JSON.stringify({}),
				attributes: {
					ApproximateReceiveCount: "1",
					SentTimestamp: "1",
					SenderId: "1",
					ApproximateFirstReceiveTimestamp: "1",
				},
				messageAttributes: {},
				md5OfBody: "1",
				eventSource: "1",
				eventSourceARN: "1",
				awsRegion: "1",
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});

	test("should throw an error if the SQSRecord body.Message is the wrong format", () => {
		let error = null;
		try {
			getS3ObjectFromS3Message({
				messageId: "1",
				receiptHandle: "1",
				body: JSON.stringify({
					Message: JSON.stringify({}),
				}),
				attributes: {
					ApproximateReceiveCount: "1",
					SentTimestamp: "1",
					SenderId: "1",
					ApproximateFirstReceiveTimestamp: "1",
				},
				messageAttributes: {},
				md5OfBody: "1",
				eventSource: "1",
				eventSourceARN: "1",
				awsRegion: "1",
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
});

describe("getS3BucketFromS3Message", () => {
	test("should extract the S3 bucket from a well-formed message", () => {
		const expectedBucketName = "test-bucket";
		const expectedBucketArn = "arn:aws:s3:::test-bucket";

		const s3Bucket = getS3BucketFromS3Message({
			messageId: "1",
			receiptHandle: "1",
			body: JSON.stringify({
				Message: JSON.stringify({
					Records: [
						{
							s3: {
								bucket: {
									name: expectedBucketName,
									arn: expectedBucketArn,
								},
								object: {
									key: "test-key",
									size: 102400,
									versionId: "test-version-id",
								},
							},
						},
					],
				}),
			}),
			attributes: {
				ApproximateReceiveCount: "1",
				SentTimestamp: "1",
				SenderId: "1",
				ApproximateFirstReceiveTimestamp: "1",
			},
			messageAttributes: {},
			md5OfBody: "1",
			eventSource: "1",
			eventSourceARN: "1",
			awsRegion: "1",
		});

		expect(s3Bucket.name).toEqual(expectedBucketName);
		expect(s3Bucket.arn).toEqual(expectedBucketArn);
	});

	test("should extract the S3 bucket from a message without arn", () => {
		const expectedBucketName = "test-bucket";

		const s3Bucket = getS3BucketFromS3Message({
			messageId: "1",
			receiptHandle: "1",
			body: JSON.stringify({
				Message: JSON.stringify({
					Records: [
						{
							s3: {
								bucket: {
									name: expectedBucketName,
								},
								object: {
									key: "test-key",
									size: 102400,
									versionId: "test-version-id",
								},
							},
						},
					],
				}),
			}),
			attributes: {
				ApproximateReceiveCount: "1",
				SentTimestamp: "1",
				SenderId: "1",
				ApproximateFirstReceiveTimestamp: "1",
			},
			messageAttributes: {},
			md5OfBody: "1",
			eventSource: "1",
			eventSourceARN: "1",
			awsRegion: "1",
		});

		expect(s3Bucket.name).toEqual(expectedBucketName);
		expect(s3Bucket.arn).toBeUndefined();
	});

	test("should throw an error if the SQSRecord body is the wrong format", () => {
		let error = null;
		try {
			getS3BucketFromS3Message({
				messageId: "1",
				receiptHandle: "1",
				body: JSON.stringify({}),
				attributes: {
					ApproximateReceiveCount: "1",
					SentTimestamp: "1",
					SenderId: "1",
					ApproximateFirstReceiveTimestamp: "1",
				},
				messageAttributes: {},
				md5OfBody: "1",
				eventSource: "1",
				eventSourceARN: "1",
				awsRegion: "1",
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});

	test("should throw an error if the SQSRecord body.Message is the wrong format", () => {
		let error = null;
		try {
			getS3BucketFromS3Message({
				messageId: "1",
				receiptHandle: "1",
				body: JSON.stringify({
					Message: JSON.stringify({}),
				}),
				attributes: {
					ApproximateReceiveCount: "1",
					SentTimestamp: "1",
					SenderId: "1",
					ApproximateFirstReceiveTimestamp: "1",
				},
				messageAttributes: {},
				md5OfBody: "1",
				eventSource: "1",
				eventSourceARN: "1",
				awsRegion: "1",
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
});
