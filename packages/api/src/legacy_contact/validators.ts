import Joi from "joi";
import type {
	CreateLegacyContactRequest,
	UpdateLegacyContactRequest,
} from "./model.js";

export const validateCreateLegacyContactRequest: (
	data: unknown,
	callerEmail: string,
) => asserts data is CreateLegacyContactRequest = (
	data: unknown,
	callerEmail: string,
): asserts data is CreateLegacyContactRequest => {
	const validation = Joi.object()
		.keys({
			email: Joi.string().email().invalid(callerEmail).required(),
			name: Joi.string().required(),
		})
		.validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};

export const validateUpdateLegacyContactRequest: (
	data: unknown,
	callerEmail: string,
) => asserts data is UpdateLegacyContactRequest = (
	data: unknown,
	callerEmail: string,
): asserts data is UpdateLegacyContactRequest => {
	const validation = Joi.object()
		.keys({
			email: Joi.string().email().invalid(callerEmail),
			name: Joi.string(),
		})
		.validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};

export const validateUpdateLegacyContactParams: (
	data: unknown,
) => asserts data is { legacyContactId: string } = (
	data: unknown,
): asserts data is { legacyContactId: string } => {
	const validation = Joi.object()
		.keys({
			legacyContactId: Joi.string().uuid().required(),
		})
		.validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};
