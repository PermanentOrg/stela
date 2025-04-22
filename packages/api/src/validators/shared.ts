import Joi from "joi";

export const fieldsFromUserAuthentication = {
	emailFromAuthToken: Joi.string().email().required(),
	userSubjectFromAuthToken: Joi.string().uuid().required(),
};

export const fieldsFromAdminAuthentication = {
	emailFromAuthToken: Joi.string().email().required(),
	adminSubjectFromAuthToken: Joi.string().uuid().required(),
};

export const fieldsFromUserOrAdminAuthentication = Joi.object()
	.keys({
		userEmailFromAuthToken: Joi.string().email(),
		userSubjectFromAuthToken: Joi.string().uuid(),
		adminEmailFromAuthToken: Joi.string().email(),
		adminSubjectFromAuthToken: Joi.string().uuid(),
	})
	.xor("userEmailFromAuthToken", "adminEmailFromAuthToken")
	.xor("userSubjectFromAuthToken", "adminSubjectFromAuthToken")
	.nand("userEmailFromAuthToken", "adminSubjectFromAuthToken")
	.nand("adminEmailFromAuthToken", "userSubjectFromAuthToken");

export function validateBodyFromAuthentication(data: unknown): asserts data is {
	emailFromAuthToken: string;
	userSubjectFromAuthToken: string;
} {
	const validation = Joi.object()
		.keys(fieldsFromUserAuthentication)
		.validate(data);
	if (validation.error) {
		throw validation.error;
	}
}

export function validateBodyFromAdminAuthentication(
	data: unknown,
): asserts data is {
	emailFromAuthToken: string;
	userSubjectFromAuthToken: string;
} {
	const validation = Joi.object()
		.keys(fieldsFromAdminAuthentication)
		.validate(data);
	if (validation.error) {
		throw validation.error;
	}
}

export function validateIsAdminFromAuthentication(
	data: unknown,
): asserts data is {
	admin: boolean;
} {
	const validation = Joi.object()
		.keys({ admin: Joi.boolean().required() })
		.validate(data);
	if (validation.error) {
		throw validation.error;
	}
}

export function validateOptionalAuthenticationValues(
	data: unknown,
): asserts data is { emailFromAuthToken?: string; shareToken: string } {
	const validation = Joi.object()
		.keys({
			emailFromAuthToken: Joi.string().email().optional(),
			shareToken: Joi.string().optional(),
		})
		.validate(data);

	if (validation.error) {
		throw validation.error;
	}
}

export function validatePaginationParameters(
	data: unknown,
): asserts data is { cursor?: string; pageSize: number } {
	const validation = Joi.object()
		.keys({
			cursor: Joi.string(),
			pageSize: Joi.number().integer().min(1).required(),
		})
		.validate(data);

	if (validation.error) {
		throw validation.error;
	}
}
