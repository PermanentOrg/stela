import type { SQSHandler, SQSEvent } from "aws-lambda";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { XMLParser } from "fast-xml-parser";
import * as Sentry from "@sentry/aws-serverless";
import {
	getS3ObjectFromS3Message,
	getS3BucketFromS3Message,
} from "@stela/s3-utils";
import { getOriginalFileIdFromInformationPackagePath } from "@stela/archivematica-utils";
import { logger } from "@stela/logger";
import { db } from "./database";
import type {
	MetsMetadata,
	MetsAdministrativeSection,
	EmbeddedMetadata,
	TrackMetadata,
} from "./models";
import { validateMetsMetadata } from "./validators";
import {
	getISOStringFromExifTimestamp,
	getISOStringFromMediaInfoTimestamp,
	getISOStringFromQuicktimeTimestamp,
} from "./timestamps";

const getOriginalAdministrativeSectionFromMetsFile = (
	fileId: string,
	metadata: MetsMetadata,
): MetsAdministrativeSection => {
	const {
		"mets:mets": { "mets:amdSec": administrativeSections },
	} = metadata;
	if (Array.isArray(administrativeSections)) {
		const originalAdministrativeSections = administrativeSections.filter(
			(section) => {
				const {
					"mets:techMD": {
						"mets:mdWrap": {
							"mets:xmlData": {
								"premis:object": { "premis:originalName": originalName },
							},
						},
					},
				} = section;
				const fileIdFromOriginalName = originalName.substring(
					originalName.lastIndexOf("/") + 1,
				);
				return fileIdFromOriginalName === fileId;
			},
		);

		if (
			originalAdministrativeSections[0] === undefined ||
			originalAdministrativeSections.length > 1
		) {
			throw new Error(
				`Wrong number of administrative metadata sections for original file; expected 1, got ${originalAdministrativeSections.length}`,
			);
		}
		return originalAdministrativeSections[0];
	}
	return administrativeSections;
};

const getEmbeddedMetadataFromS3 = async (
	s3BucketName: string,
	s3Key: string,
	fileId: string,
): Promise<EmbeddedMetadata | undefined> => {
	const s3Client = new S3Client({
		region: process.env["AWS_REGION"] ?? "",
	});
	const metadataFileResponse = await s3Client.send(
		new GetObjectCommand({ Bucket: s3BucketName, Key: s3Key }),
	);
	const metadataFileContents =
		await metadataFileResponse.Body?.transformToString();

	if (metadataFileContents === undefined) {
		throw Error("metadata file is empty");
	}

	const xmlParser = new XMLParser();
	const metadata: unknown = xmlParser.parse(metadataFileContents);
	validateMetsMetadata(metadata);

	const administrativeSection = getOriginalAdministrativeSectionFromMetsFile(
		fileId,
		metadata,
	);

	const {
		"mets:techMD": {
			"mets:mdWrap": {
				"mets:xmlData": {
					"premis:object": {
						"premis:objectCharacteristics": {
							"premis:objectCharacteristicsExtension":
								objectCharacteristicsExtensionSection,
						},
					},
				},
			},
		},
	} = administrativeSection;

	return objectCharacteristicsExtensionSection;
};

const getPhotoMetadata = (
	embeddedMetadata: EmbeddedMetadata,
): {
	creationTime: Date | undefined;
	creationTimeInEdtf: string | undefined;
	tags: string[] | undefined;
	description: string | undefined;
	title: string | undefined;
	altText: string | undefined;
} => {
	const {
		"rdf:RDF": { "rdf:Description": rdfMetadata },
	} = embeddedMetadata;

	const timestamp =
		rdfMetadata["ExifIFD:DateTimeOriginal"] === undefined
			? undefined
			: getISOStringFromExifTimestamp(
					rdfMetadata["ExifIFD:DateTimeOriginal"],
					rdfMetadata["ExifIFD:OffsetTimeOriginal"],
				);
	const tags =
		rdfMetadata["IPTC:Keywords"] === undefined
			? undefined
			: rdfMetadata["IPTC:Keywords"]["rdf:Bag"]["rdf:li"];

	return {
		creationTime:
			rdfMetadata["ExifIFD:OffsetTimeOriginal"] === undefined ||
			timestamp === undefined
				? undefined
				: new Date(timestamp),
		creationTimeInEdtf: timestamp,
		tags,
		description:
			rdfMetadata["IPTC:Caption-Abstract"] ??
			rdfMetadata["ExifIFD:UserComment"] ??
			rdfMetadata["ExifIFD:Comments"],
		title: rdfMetadata["IPTC:ObjectName"] ?? rdfMetadata["ExifIFD:Title"],
		altText: rdfMetadata["XMP-iptcCore:AltTextAccessibility"],
	};
};

const getVideoMetadataFromMediaInfo = (
	embeddedMetadata: EmbeddedMetadata,
):
	| {
			creationTime: Date | undefined;
			creationTimeInEdtf: string | undefined;
	  }
	| undefined => {
	const tracks = embeddedMetadata.MediaInfo?.media.track;
	if (tracks === undefined) {
		return undefined;
	}

	const generalTracks = tracks.filter(
		(track: TrackMetadata) => track.StreamKind === "General",
	);
	if (generalTracks.length > 1) {
		logger.info(
			`Video Metadata contains too many general tracks, expected 1; got ${generalTracks.length}`,
		);
		return undefined;
	}

	const [generalTrack] = generalTracks;
	if (generalTrack === undefined) {
		return undefined;
	}

	const timestampFromMediaInfo =
		generalTrack.File_Created_Date ??
		generalTrack.Recorded_Date ??
		generalTrack.Encoded_Date;
	if (timestampFromMediaInfo === undefined) {
		return undefined;
	}

	const isoFormattedTimestamp = getISOStringFromMediaInfoTimestamp(
		timestampFromMediaInfo,
	);

	return {
		creationTime:
			isoFormattedTimestamp === undefined
				? undefined
				: new Date(isoFormattedTimestamp),
		creationTimeInEdtf: isoFormattedTimestamp,
	};
};

const getVideoMetadataFromQuickTimeMetadata = (
	embeddedMetadata: EmbeddedMetadata,
): {
	creationTime: Date | undefined;
	creationTimeInEdtf: string | undefined;
} => {
	const {
		"rdf:RDF": {
			"rdf:Description": { "QuickTime:CreationDate": quicktimeTimestamp },
		},
	} = embeddedMetadata;
	const isoFormattedTimestamp =
		quicktimeTimestamp === undefined
			? undefined
			: getISOStringFromQuicktimeTimestamp(quicktimeTimestamp);
	return {
		creationTime:
			isoFormattedTimestamp === undefined
				? undefined
				: new Date(isoFormattedTimestamp),
		creationTimeInEdtf: isoFormattedTimestamp,
	};
};

const getVideoMetadata = (
	embeddedMetadata: EmbeddedMetadata,
): {
	creationTime: Date | undefined;
	creationTimeInEdtf: string | undefined;
} =>
	getVideoMetadataFromMediaInfo(embeddedMetadata) ??
	getVideoMetadataFromQuickTimeMetadata(embeddedMetadata);

export const handler: SQSHandler = Sentry.wrapHandler(
	async (event: SQSEvent) => {
		await Promise.all(
			event.Records.map(async (message) => {
				const s3Bucket = getS3BucketFromS3Message(message);
				const s3Object = getS3ObjectFromS3Message(message);
				const { key } = s3Object;
				if (!key.includes("METS")) {
					// If this isn't the metadata file, it's irrelevant to this lambda
					return;
				}

				const fileId = getOriginalFileIdFromInformationPackagePath(key);
				const embeddedMetadata = await getEmbeddedMetadataFromS3(
					s3Bucket.name,
					key,
					fileId,
				);

				if (embeddedMetadata === undefined) {
					// If there was no embedded metadata in the file, we have nothing to do here
					return;
				}

				const {
					"rdf:RDF": {
						"rdf:Description": { "File:MIMEType": mimeType },
					},
				} = embeddedMetadata;
				const [mimeCategory] = mimeType.split("/");
				if (mimeCategory === "image") {
					const photoMetadata = getPhotoMetadata(embeddedMetadata);
					await db.sql("queries.update_metadata", {
						fileId,
						fileTags: photoMetadata.tags,
						nameFromEmbeddedMetadata: photoMetadata.title,
						descriptionFromEmbeddedMetadata: photoMetadata.description,
						timestampFromEmbeddedMetadata:
							photoMetadata.creationTime?.toISOString(),
						timeFromEmbeddedMetadata: photoMetadata.creationTimeInEdtf,
						altTextFromEmbeddedMetadata: photoMetadata.altText,
					});
				} else if (mimeCategory === "video") {
					const videoMetadata = getVideoMetadata(embeddedMetadata);
					await db.sql("queries.update_metadata", {
						fileId,
						timestampFromEmbeddedMetadata:
							videoMetadata.creationTime?.toISOString(),
						timeFromEmbeddedMetadata: videoMetadata.creationTimeInEdtf,
						fileTags: [],
						nameFromEmbeddedMetadata: null,
						descriptionFromEmbeddedMetadata: null,
						altTextFromEmbeddedMetadata: null,
					});
				}
			}),
		);
	},
);
