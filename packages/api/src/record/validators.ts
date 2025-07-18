import Joi from "joi";
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
		})
		.validate(data);

	if (validation.error !== undefined) {
		throw validation.error;
	}
};
