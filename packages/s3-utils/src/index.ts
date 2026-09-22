import { getSignedUrl } from "aws-cloudfront-sign";
import type { SQSRecord } from "aws-lambda";
import { logger } from "@stela/logger";
import {
	validateNewDisseminationPackageJpgEvent,
	validateSqsMessage,
	type S3Object,
	type S3Bucket,
} from "./validators.js";

const yearsUntilCdnUrlExpiration = 1;

export { validateSqsMessage };
export type { S3Object, S3Bucket };

// left unescaped by `encodeURIComponent`; escaped to match PHP's `rawurlencode`
const rfc5987Escapes = new Map([
	["!", "%21"],
	["'", "%27"],
	["(", "%28"],
	[")", "%29"],
	["*", "%2A"],
]);

const encodeRfc5987 = (value: string): string =>
	encodeURIComponent(value).replace(
		/[!'\(\)*]/gv,
		(character) => rfc5987Escapes.get(character) ?? character,
	);

// modern browsers take `filename*=`, older ones need `filename=`
export const buildContentDisposition = (fileName: string): string => {
	// ASCII-only fallback: replace any non-printable-ASCII code point, then
	// neutralise the characters that would otherwise break the quoted-string.
	const asciiFallback = fileName
		.replace(/[^\x20-\x7e]/gv, "_")
		.replace(/["\\]/gv, "_");

	const disposition = `attachment; filename="${asciiFallback}"`;

	// Add the RFC 5987 extended parameter only when the name needs it; plain
	// ASCII names keep their existing, simpler header.
	return asciiFallback === fileName
		? disposition
		: `${disposition}; filename*=UTF-8''${encodeRfc5987(fileName)}`;
};

export const constructSignedCdnUrl = (
	key: string,
	fileName?: string,
): string => {
	let url = `${process.env["CLOUDFRONT_URL"] ?? ""}${key}`;
	if (fileName !== undefined) {
		const urlObject = new URL(url);
		urlObject.searchParams.append(
			"response-content-disposition",
			buildContentDisposition(fileName),
		);
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
		parsedMessage.Records[0] === undefined
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

export const getS3BucketFromS3Message = (message: SQSRecord): S3Bucket => {
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
		parsedMessage.Records[0] === undefined
	) {
		logger.error(
			`Invalid message body: ${JSON.stringify(
				validateNewDisseminationPackageJpgEvent.errors,
			)}`,
		);
		throw new Error("Invalid message body");
	}

	return parsedMessage.Records[0].s3.bucket;
};
