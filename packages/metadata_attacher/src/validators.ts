import Joi from "joi";
import { logger } from "@stela/logger";
import type { MetsMetadata } from "./models";

const embeddedMetadataSchema = Joi.object({
	"IPTC:ObjectName": Joi.string().optional(),
	"IPTC:Caption-Abstract": Joi.string().optional(),
	"IPTC:Keywords": Joi.object({
		"rdf:Bag": Joi.object({
			"rdf:li": Joi.array().items(Joi.string()).required(),
		}).required(),
	}).optional(),
	"ExifIFD:DateTimeOriginal": Joi.string().optional(),
	"ExifIFD:OffsetTimeOriginal": Joi.string().optional(),
	"XMP-iptcCore:AltTextAccessibility": Joi.string().optional(),
}).unknown(true);

const metsAdministrativeSectionSchema = Joi.object({
	"mets:techMD": Joi.object({
		"mets:mdWrap": Joi.object({
			"mets:xmlData": Joi.object({
				"premis:object": Joi.object({
					"premis:originalName": Joi.string().required(),
					"premis:objectCharacteristics": Joi.object({
						"premis:objectCharacteristicsExtension": Joi.object({
							"rdf:RDF": Joi.object({
								"rdf:Description": embeddedMetadataSchema.required(),
							})
								.required()
								.unknown(true),
						})
							.optional()
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
