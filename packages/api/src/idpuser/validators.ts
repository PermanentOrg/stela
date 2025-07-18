import Joi from "joi";
import type {
	SendEnableCodeRequest,
	SendDisableCodeRequest,
	CreateTwoFactorMethodRequest,
	DisableTwoFactorRequest,
} from "./models";
import { fieldsFromUserAuthentication } from "../validators";

export const validateSendEnableCodeRequest: (
	data: unknown,
) => asserts data is SendEnableCodeRequest = (
	data: unknown,
): asserts data is SendEnableCodeRequest => {
	const validation = Joi.object()
		.keys({
			...fieldsFromUserAuthentication,
			method: Joi.string().valid("email", "sms").required(),
			value: Joi.string().required().when("method", {
				is: "email",
				then: Joi.string().email(),
			}),
		})
		.validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};

export const validateCreateTwoFactorMethodRequest: (
	data: unknown,
) => asserts data is CreateTwoFactorMethodRequest = (
	data: unknown,
): asserts data is CreateTwoFactorMethodRequest => {
	const validation = Joi.object()
		.keys({
			...fieldsFromUserAuthentication,
			code: Joi.string().required(),
			method: Joi.string().valid("email", "sms").required(),
			value: Joi.string().required().when("method", {
				is: "email",
				then: Joi.string().email(),
			}),
		})
		.validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};

export const validateSendDisableCodeRequest: (
	data: unknown,
) => asserts data is SendDisableCodeRequest = (
	data: unknown,
): asserts data is SendDisableCodeRequest => {
	const validation = Joi.object()
		.keys({
			...fieldsFromUserAuthentication,
			methodId: Joi.string().required(),
		})
		.validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};

export const validateDisableTwoFactorRequest: (
	data: unknown,
) => asserts data is DisableTwoFactorRequest = (
	data: unknown,
): asserts data is DisableTwoFactorRequest => {
	const validation = Joi.object()
		.keys({
			...fieldsFromUserAuthentication,
			methodId: Joi.string().required(),
			code: Joi.string().required(),
		})
		.validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};
