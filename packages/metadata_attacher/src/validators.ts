import Joi from "joi";
import { logger } from "@stela/logger";
import type { MetsMetadata } from "./models";

const rdfMetadataSchema = Joi.object({
	"File:MIMEType": Joi.string().required(),
	"IPTC:ObjectName": Joi.string().optional().empty(""),
	"IPTC:Caption-Abstract": Joi.string().optional().empty(""),
	"IPTC:Keywords": Joi.object({
		"rdf:Bag": Joi.object({
			"rdf:li": Joi.array().items(Joi.string()).required(),
		}).required(),
	}).optional(),
	"ExifIFD:Title": Joi.string().optional().empty(""),
	"ExifIFD:UserComment": Joi.string().optional().empty(""),
	"ExifIFD:Comments": Joi.string().optional().empty(""),
	"ExifIFD:DateTimeOriginal": Joi.string().optional().empty(""),
	"ExifIFD:OffsetTimeOriginal": Joi.string().optional().empty(""),
	"XMP-iptcCore:AltTextAccessibility": Joi.string().optional().empty(""),
	"QuickTime:CreationDate": Joi.string().optional().empty(""),
}).unknown(true);

const trackMetadataSchema = Joi.object({
	StreamKind: Joi.string().required(),
	File_Created_Date: Joi.string().optional(),
	Recorded_Date: Joi.string().optional(),
	Encoded_Date: Joi.string().optional(),
}).unknown(true);

const embeddedMetadataSchema = Joi.object({
	"rdf:RDF": Joi.object({
		"rdf:Description": rdfMetadataSchema.required(),
	})
		.required()
		.unknown(true),
	MediaInfo: Joi.object({
		media: Joi.object({
			track: Joi.array().items(trackMetadataSchema).required(),
		})
			.required()
			.unknown(true),
	})
		.optional()
		.unknown(true),
}).unknown(true);

const metsAdministrativeSectionSchema = Joi.object({
	"mets:techMD": Joi.object({
		"mets:mdWrap": Joi.object({
			"mets:xmlData": Joi.object({
				"premis:object": Joi.object({
					"premis:originalName": Joi.string().required(),
					"premis:objectCharacteristics": Joi.object({
						"premis:objectCharacteristicsExtension":
							embeddedMetadataSchema.optional(),
					})
						.required()
						.unknown(true),
				})
					.required()
					.unknown(true),
			})
				.required()
				.unknown(true),
		})
			.required()
			.unknown(true),
	})
		.required()
		.unknown(true),
}).unknown(true);

const metsMetadataSchema = Joi.object({
	"mets:mets": Joi.object({
		"mets:amdSec": Joi.alternatives()
			.try(
				Joi.array().items(metsAdministrativeSectionSchema).min(1),
				metsAdministrativeSectionSchema,
			)
			.required(),
	})
		.required()
		.unknown(true),
}).unknown(true);

export function validateMetsMetadata(
	data: unknown,
): asserts data is MetsMetadata {
	const validation = metsMetadataSchema.validate(data);
	if (validation.error !== undefined) {
		logger.error(validation.error);
		throw validation.error;
	}
}
