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
			locationId: Joi.number().integer().optional().allow(null),
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
		.or("locationId", "description", "displayName", "displayTime")
		.unknown(false)
		.validate(data);

	if (validation.error !== undefined) {
		throw validation.error;
	}
};
