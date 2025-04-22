import Joi from "joi";
import type {
	SendEnableCodeRequest,
	SendDisableCodeRequest,
	CreateTwoFactorMethodRequest,
	DisableTwoFactorRequest,
} from "./models";
import { fieldsFromUserAuthentication } from "../validators";

export function validateSendEnableCodeRequest(
	data: unknown,
): asserts data is SendEnableCodeRequest {
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
	if (validation.error) {
		throw validation.error;
	}
}

export function validateCreateTwoFactorMethodRequest(
	data: unknown,
): asserts data is CreateTwoFactorMethodRequest {
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
	if (validation.error) {
		throw validation.error;
	}
}

export function validateSendDisableCodeRequest(
	data: unknown,
): asserts data is SendDisableCodeRequest {
	const validation = Joi.object()
		.keys({
			...fieldsFromUserAuthentication,
			methodId: Joi.string().required(),
		})
		.validate(data);
	if (validation.error) {
		throw validation.error;
	}
}

export function validateDisableTwoFactorRequest(
	data: unknown,
): asserts data is DisableTwoFactorRequest {
	const validation = Joi.object()
		.keys({
			...fieldsFromUserAuthentication,
			methodId: Joi.string().required(),
			code: Joi.string().required(),
		})
		.validate(data);
	if (validation.error) {
		throw validation.error;
	}
}
