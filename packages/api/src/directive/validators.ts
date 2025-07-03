import Joi from "joi";
import type { CreateDirectiveRequest, UpdateDirectiveRequest } from "./model";
import {
	validateBodyFromAuthentication,
	fieldsFromUserAuthentication,
} from "../validators";

export { validateBodyFromAuthentication };

export const validateCreateDirectiveRequest: (
	data: unknown,
) => asserts data is CreateDirectiveRequest = (
	data: unknown,
): asserts data is CreateDirectiveRequest => {
	const validation = Joi.object()
		.keys({
			...fieldsFromUserAuthentication,
			archiveId: Joi.string().required(),
			stewardEmail: Joi.when("type", {
				is: Joi.string().valid("transfer"),
				then: Joi.string()
					.email()
					.invalid(Joi.ref("emailFromAuthToken"))
					.required(),
				otherwise: Joi.valid(null),
			}),
			type: Joi.string().required(),
			note: Joi.string().allow(""),
			trigger: Joi.object()
				.keys({
					type: Joi.string().required(),
				})
				.required(),
		})
		.validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};

export const validateUpdateDirectiveParams: (
	data: unknown,
) => asserts data is { directiveId: string } = (
	data: unknown,
): asserts data is { directiveId: string } => {
	const validation = Joi.object()
		.keys({
			directiveId: Joi.string().uuid().required(),
		})
		.validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};

export const validateUpdateDirectiveRequest: (
	data: unknown,
) => asserts data is UpdateDirectiveRequest = (
	data: unknown,
): asserts data is UpdateDirectiveRequest => {
	const validation = Joi.object()
		.keys({
			...fieldsFromUserAuthentication,
			stewardEmail: Joi.when("type", {
				is: Joi.string().valid("transfer"),
				then: Joi.string().invalid(Joi.ref("emailFromAuthToken")).email(),
				otherwise: Joi.valid(null),
			}),
			type: Joi.string(),
			note: Joi.string().allow(""),
			trigger: Joi.object().keys({
				type: Joi.string(),
			}),
		})
		.validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};

export const validateTriggerAdminDirectivesParams: (
	data: unknown,
) => asserts data is { accountId: string } = (
	data: unknown,
): asserts data is { accountId: string } => {
	const validation = Joi.object()
		.keys({
			accountId: Joi.string().required(),
		})
		.validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};

export const validateGetDirectivesByArchiveIdParams: (
	data: unknown,
) => asserts data is { archiveId: string } = (
	data: unknown,
): asserts data is { archiveId: string } => {
	const validation = Joi.object()
		.keys({
			archiveId: Joi.string().required(),
		})
		.validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};
