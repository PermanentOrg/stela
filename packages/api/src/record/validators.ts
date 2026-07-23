import Joi from "joi";
import { parse as parseEDTF } from "@edtf-ts/core";
import type { CreateRecordCopyRequest, PatchRecordRequest } from "./models.js";
import { fieldsFromUserAuthentication } from "../validators/index.js";
import { paginationFields } from "../validators/shared.js";
import { locationInputSchema } from "../location/validators.js";
import { EDTF_LEVEL_2 } from "../constants.js";

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

export const validateGetRecordsPageQuery: (data: unknown) => asserts data is {
	recordIds?: string[];
	archiveId?: string;
	cursor?: string;
	pageSize: number;
} = (
	data: unknown,
): asserts data is {
	recordIds?: string[];
	archiveId?: string;
	cursor?: string;
	pageSize: number;
} => {
	const validation = Joi.object()
		.keys({
			recordIds: Joi.array().items(Joi.string().required()),
			archiveId: Joi.string(),
			...paginationFields,
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
			locationId: Joi.number().integer().optional().allow(null),
			location: locationInputSchema.optional(),
			description: Joi.string().optional().allow(null),
			displayName: Joi.string().min(1).optional(),
			displayTime: Joi.string()
				.custom((value: string) => {
					const result = parseEDTF(value, EDTF_LEVEL_2);
					if (result.success) {
						return value;
					}
					const detail = result.errors.map((e) => e.message).join("; ");
					throw new Error(`${value} is not valid Level 2 EDTF: ${detail}`);
				})
				.optional()
				.allow(null),
		})
		// We can't use .min(1) here due to the auth fields being in the body
		// See: https://github.com/PermanentOrg/stela/issues/407
		.or("locationId", "location", "description", "displayName", "displayTime")
		.oxor("locationId", "location")
		.unknown(false)
		.validate(data);

	if (validation.error !== undefined) {
		throw validation.error;
	}
};

export const validateCreateRecordCopyRequest: (
	data: unknown,
) => asserts data is CreateRecordCopyRequest = (
	data: unknown,
): asserts data is CreateRecordCopyRequest => {
	const validation = Joi.object()
		.keys({
			...fieldsFromUserAuthentication,
			destinationFolderId: Joi.string().required(),
			ip: Joi.string().required(),
		})
		.unknown(false)
		.validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};
