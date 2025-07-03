import Joi from "joi";
import { fieldsFromAdminAuthentication } from "../validators";

export const validateRecalculateFolderThumbnailsRequest: (
	data: unknown,
) => asserts data is { beginTimestamp: Date; endTimestamp: Date } = (
	data: unknown,
): asserts data is { beginTimestamp: Date; endTimestamp: Date } => {
	const validation = Joi.object()
		.keys({
			...fieldsFromAdminAuthentication,
			beginTimestamp: Joi.date().iso().required(),
			endTimestamp: Joi.date().iso().required(),
		})
		.validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};

export const validateAccountSetNullSubjectsRequest: (
	data: unknown,
) => asserts data is { accounts: { email: string; subject: string }[] } = (
	data: unknown,
): asserts data is { accounts: { email: string; subject: string }[] } => {
	const validation = Joi.object()
		.keys({
			...fieldsFromAdminAuthentication,
			accounts: Joi.array()
				.items(
					Joi.object({
						email: Joi.string().email().required(),
						subject: Joi.string().uuid().required(),
					}),
				)
				.required(),
		})
		.validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};

export const validateRecalculateRecordThumbnailRequest: (
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
