import Joi from "joi";
import type { CreateLegacyContactRequest } from "./model";
import {
	fieldsFromUserAuthentication,
	validateBodyFromAuthentication,
} from "../validators";

export { validateBodyFromAuthentication };

export const validateCreateLegacyContactRequest: (
	data: unknown,
) => asserts data is CreateLegacyContactRequest = (
	data: unknown,
): asserts data is CreateLegacyContactRequest => {
	const validation = Joi.object()
		.keys({
			...fieldsFromUserAuthentication,
			email: Joi.string()
				.email()
				.invalid(Joi.ref("emailFromAuthToken"))
				.required(),
			name: Joi.string().required(),
		})
		.validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};

export const validateUpdateLegacyContactRequest: (
	data: unknown,
) => asserts data is CreateLegacyContactRequest = (
	data: unknown,
): asserts data is CreateLegacyContactRequest => {
	const validation = Joi.object()
		.keys({
			...fieldsFromUserAuthentication,
			email: Joi.string().email().invalid(Joi.ref("emailFromAuthToken")),
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
