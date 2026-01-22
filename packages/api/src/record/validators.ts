import Joi from "joi";
import { isValid as isValidEDTF } from "@edtf-ts/core";
import type { PatchRecordRequest } from "./models";
import { fieldsFromUserAuthentication } from "../validators";

export const validateGetRecordQuery: (
	data: unknown,
) => asserts data is { recordIds: string[] } = (
	data: unknown,
): asserts data is { recordIds: string[] } => {
	const validation = Joi.object()
		.keys({
			recordIds: Joi.array().items(Joi.string().required()).required(),
		})
		.validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};
export const validateRecordRequest: (
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
			displayTimeInEDTF: Joi.string()
				.custom((value: string) => {
					if (isValidEDTF(value, 1)) {
						return value;
					} else {
						throw new Error(`${value} is not valid Level 1 EDTF`);
					}
				})
				.optional()
				.allow(null),
		})
		// We can't use .min(1) here due to the auth fields being in the body
		// See: https://github.com/PermanentOrg/stela/issues/407
		.or("locationId", "description", "displayName", "displayTimeInEDTF")
		.unknown(false)
		.validate(data);

	if (validation.error !== undefined) {
		throw validation.error;
	}
};
