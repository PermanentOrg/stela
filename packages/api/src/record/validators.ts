import Joi from "joi";
import { parse as parseEDTF } from "@edtf-ts/core";
import type { PatchRecordRequest } from "./models";
import { fieldsFromUserAuthentication } from "../validators";

export const validateGetRecordQuery: (
	data: unknown,
) => asserts data is { recordIds?: string[]; archiveId?: string } = (
	data: unknown,
): asserts data is { recordIds?: string[]; archiveId?: string } => {
	const validation = Joi.object()
		.keys({
			recordIds: Joi.array().items(Joi.string().required()),
			archiveId: Joi.string(),
		})
		.or("recordIds", "archiveId")
		.validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};
export const validateSingleRecordParams: (
	data: unknown,
) => asserts data is { recordId: string } = (
	data: unknown,
): asserts data is { recordId: string } => {
	const validation = Joi.object()
		.keys({
			recordId: Joi.string().required(),
		})
		.validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};

export const validatePatchRecordRequest: (
	data: unknown,
) => asserts data is PatchRecordRequest = (
	data: unknown,
): asserts data is PatchRecordRequest => {
	const validation = Joi.object()
		.keys({
			...fieldsFromUserAuthentication,
			location: Joi.object()
				.keys({
					name: Joi.string().optional().allow(null),
					sublocation: Joi.string().optional().allow(null),
					city: Joi.string().optional().allow(null),
					state: Joi.string().optional().allow(null),
					postalCode: Joi.string().optional().allow(null),
					country: Joi.string().optional().allow(null),
					latitude: Joi.number().optional().allow(null),
					longitude: Joi.number().optional().allow(null),
					altitudeMeters: Joi.number().optional().allow(null),
					precision: Joi.string()
						.valid("approximate", "uncertain", "unknown")
						.optional()
						.allow(null),
					streetNumber: Joi.string().optional().allow(null),
					streetName: Joi.string().optional().allow(null),
					locality: Joi.string().optional().allow(null),
					county: Joi.string().optional().allow(null),
					countryCode: Joi.string().optional().allow(null),
					displayName: Joi.string().optional().allow(null),
				})
				.optional()
				.allow(null),
			description: Joi.string().optional().allow(null),
			displayName: Joi.string().min(1).optional(),
			displayTime: Joi.string()
				.custom((value: string) => {
					const result = parseEDTF(value, 1);
					if (result.success) {
						return value;
					}
					const detail = result.errors.map((e) => e.message).join("; ");
					throw new Error(`${value} is not valid Level 1 EDTF: ${detail}`);
				})
				.optional()
				.allow(null),
		})
		// We can't use .min(1) here due to the auth fields being in the body
		// See: https://github.com/PermanentOrg/stela/issues/407
		.or("location", "description", "displayName", "displayTime")
		.unknown(false)
		.validate(data);

	if (validation.error !== undefined) {
		throw validation.error;
	}
};
