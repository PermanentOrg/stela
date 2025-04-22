import { getSignedUrl } from "aws-cloudfront-sign";
import type { SQSRecord } from "aws-lambda";
import { logger } from "@stela/logger";
import {
	validateNewDisseminationPackageJpgEvent,
	validateSqsMessage,
	type S3Object,
} from "./validators";

const yearsUntilCdnUrlExpiration = 1;

export { validateSqsMessage };

export const constructSignedCdnUrl = (
	key: string,
	fileName?: string,
): string => {
	let url = `${process.env["CLOUDFRONT_URL"] ?? ""}${key}`;
	if (fileName !== undefined) {
		const urlObject = new URL(url);
		urlObject.searchParams.append("response-content-disposition", fileName);
		url = urlObject.toString();
	}
	const expirationTime = new Date();
	expirationTime.setFullYear(
		expirationTime.getFullYear() + yearsUntilCdnUrlExpiration,
	);

	return getSignedUrl(url, {
		expireTime: expirationTime.getTime(),
		keypairId: process.env["CLOUDFRONT_KEY_PAIR_ID"] ?? "",
		privateKeyString: process.env["CLOUDFRONT_PRIVATE_KEY"] ?? "",
	});
};

export const getS3ObjectFromS3Message = (message: SQSRecord): S3Object => {
	const { body } = message;
	const parsedBody: unknown = JSON.parse(body);
	if (!validateSqsMessage(parsedBody)) {
		logger.error(
			`Invalid message body: ${JSON.stringify(validateSqsMessage.errors)}`,
		);
		throw new Error("Invalid message body");
	}
	const parsedMessage: unknown = JSON.parse(parsedBody.Message);
	if (
		!validateNewDisseminationPackageJpgEvent(parsedMessage) ||
		!parsedMessage.Records[0]
	) {
		logger.error(
			`Invalid message body: ${JSON.stringify(
				validateNewDisseminationPackageJpgEvent.errors,
			)}`,
		);
		throw new Error("Invalid message body");
	}

	return parsedMessage.Records[0].s3.object;
};
