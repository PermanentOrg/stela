import { logger } from "@stela/logger";

type ExifTimestamp =
	`${number}${number}${number}${number}:${number}${number}:${number}${number} ${number}${number}:${number}${number}:${number}${number}`;
const isExifTimestamp = (value: string): value is ExifTimestamp =>
	/^(?:\d{4}):(?:0[1-9]|1[0-2]):(?:0[1-9]|[12]\d|3[01]) (?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/v.test(
		value,
	);
export const getISOStringFromExifTimestamp = (
	exifTimestamp: string,
	exifOffset: string | undefined,
): string | undefined => {
	// We expect exifTimestamp to be of the form YYYY:MM:DD HH:MM:SS
	// We expect exifOffset to be of the form ±HH:MM
	if (!isExifTimestamp(exifTimestamp)) {
		logger.info(`Invalid timestamp: ${exifTimestamp}`);
		return undefined;
	}
	const timestampPieces = exifTimestamp.split(" ");
	if (timestampPieces[0] === undefined || timestampPieces[1] === undefined) {
		logger.info(`Invalid timestamp: ${exifTimestamp}`);
		return undefined;
	}
	const dateComponent = timestampPieces[0].replaceAll(":", "-");
	const [, timeComponent] = timestampPieces;
	return `${dateComponent}T${timeComponent}${exifOffset === undefined ? "" : exifOffset === "+00:00" ? "Z" : exifOffset}`;
};

type MediaInfoTimestamp =
	`${number}${number}${number}${number}-${number}${number}-${number}${number} ${number}${number}:${number}${number}:${number}${number} UTC`;
const isMediaInfoTimestamp = (value: string): value is MediaInfoTimestamp =>
	/^(?:\d{4})-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01]) (?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d UTC$/v.test(
		value,
	);
export const getISOStringFromMediaInfoTimestamp = (
	timestamp: string,
): string | undefined => {
	// We expect timestamp to be of the form YYYY-MM-DD HH:MM:SS UTC
	if (!isMediaInfoTimestamp(timestamp)) {
		logger.info(`Invalid timestamp: ${timestamp}`);
		return undefined;
	}
	const timestampPieces = timestamp.split(" ");
	const [dateComponent, timeComponent, timezoneComponent] = timestampPieces;
	if (
		dateComponent === undefined ||
		timeComponent === undefined ||
		timezoneComponent === undefined
	) {
		logger.info(`Invalid timestamp: ${timestamp}`);
		return undefined;
	}
	if (timezoneComponent !== "UTC") {
		logger.info(
			`MediaInfo timestamps should be in UTC, this one has timezone: ${timezoneComponent}`,
		);
		return undefined;
	}
	return `${dateComponent}T${timeComponent}Z`;
};

type QuicktimeTimestamp =
	`${number}${number}${number}${number}:${number}${number}:${number}${number} ${number}${number}:${number}${number}:${number}${number}${"+" | "-"}${number}${number}:${number}${number}`;
const isQuicktimeTimestamp = (value: string): value is QuicktimeTimestamp =>
	/^(?:\d{4}):(?:0[1-9]|1[0-2]):(?:0[1-9]|[12]\d|3[01]) (?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\+|-)(?:[01]\d|2[0-3]):[0-5]\d$/v.test(
		value,
	);
export const getISOStringFromQuicktimeTimestamp = (
	timestamp: string,
): string | undefined => {
	// We expect timestamp to be of the form YYYY:MM:DD HH:MM:SS±HH:MM
	if (!isQuicktimeTimestamp(timestamp)) {
		logger.info(`Invalid timestamp: ${timestamp}`);
		return undefined;
	}
	const timestampPieces = timestamp.split(" ");
	if (timestampPieces[0] === undefined || timestampPieces[1] === undefined) {
		logger.info(`Invalid timestamp: ${timestamp}`);
		return undefined;
	}
	const dateComponent = timestampPieces[0].replaceAll(":", "-");
	const timeComponent = timestampPieces[1].replace("+00:00", "Z");
	return `${dateComponent}T${timeComponent}`;
};
