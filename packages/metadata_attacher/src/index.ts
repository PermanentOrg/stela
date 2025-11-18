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
} from "./models";
import { validateMetsMetadata } from "./validators";

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

const getISOStringFromExifTimestamp = (
	exifTimestamp: string,
	exifOffset: string | undefined,
): string | undefined => {
	const timestampPieces = exifTimestamp.split(" ");
	if (timestampPieces[0] === undefined || timestampPieces[1] === undefined) {
		logger.warn(`Invalid timestamp: ${exifTimestamp}`);
		return undefined;
	}
	const dateComponent = timestampPieces[0].replaceAll(":", "-");
	const [, timeComponent] = timestampPieces;
	return (
		dateComponent +
		"T" +
		timeComponent +
		(exifOffset === undefined ? "" : exifOffset === "+00:00" ? "Z" : exifOffset)
	);
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

	const objectCharacteristicsExtensionSection =
		administrativeSection["mets:techMD"]["mets:mdWrap"]["mets:xmlData"][
			"premis:object"
		]["premis:objectCharacteristics"]["premis:objectCharacteristicsExtension"];

	return objectCharacteristicsExtensionSection === undefined
		? undefined
		: objectCharacteristicsExtensionSection["rdf:RDF"]["rdf:Description"];
};

export const handler: SQSHandler = Sentry.wrapHandler(
	async (event: SQSEvent, _, __) => {
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

				const timestamp =
					embeddedMetadata["ExifIFD:DateTimeOriginal"] === undefined
						? undefined
						: getISOStringFromExifTimestamp(
								embeddedMetadata["ExifIFD:DateTimeOriginal"],
								embeddedMetadata["ExifIFD:OffsetTimeOriginal"],
							);
				const tags =
					embeddedMetadata["IPTC:Keywords"] === undefined
						? undefined
						: embeddedMetadata["IPTC:Keywords"]["rdf:Bag"]["rdf:li"];

				await db.sql("queries.update_metadata", {
					fileId,
					fileTags: tags,
					nameFromEmbeddedMetadata:
						embeddedMetadata["IPTC:ObjectName"] ??
						embeddedMetadata["ExifIFD:Title"],
					descriptionFromEmbeddedMetadata:
						embeddedMetadata["IPTC:Caption-Abstract"] ??
						embeddedMetadata["ExifIFD:UserComment"] ??
						embeddedMetadata["ExifIFD:Comments"],
					timestampFromEmbeddedMetadata:
						embeddedMetadata["ExifIFD:OffsetTimeOriginal"] === undefined ||
						timestamp === undefined
							? null
							: new Date(timestamp).toISOString(),
					timeFromEmbeddedMetadata: timestamp,
					altTextFromEmbeddedMetadata:
						embeddedMetadata["XMP-iptcCore:AltTextAccessibility"],
				});
			}),
		);
	},
);
