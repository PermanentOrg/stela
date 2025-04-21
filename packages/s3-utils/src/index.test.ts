import { getSignedUrl } from "aws-cloudfront-sign";
import { constructSignedCdnUrl, getS3ObjectFromS3Message } from "./index";

jest.mock("aws-cloudfront-sign");

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

		expect(getSignedUrl).toHaveBeenCalledWith(
			`${mockCloudfrontUrl}${testKey}?response-content-disposition=${testFileName}`,
			expect.anything(),
		);
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
