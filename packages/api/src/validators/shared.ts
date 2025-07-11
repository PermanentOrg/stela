import Joi from "joi";

const MINIMUM_PAGE_SIZE = 1;

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

export const validateBodyFromAuthentication: (
	data: unknown,
) => asserts data is {
	emailFromAuthToken: string;
	userSubjectFromAuthToken: string;
} = (
	data: unknown,
): asserts data is {
	emailFromAuthToken: string;
	userSubjectFromAuthToken: string;
} => {
	const validation = Joi.object()
		.keys(fieldsFromUserAuthentication)
		.validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};

export const validateBodyFromAdminAuthentication: (
	data: unknown,
) => asserts data is {
	emailFromAuthToken: string;
	userSubjectFromAuthToken: string;
} = (
	data: unknown,
): asserts data is {
	emailFromAuthToken: string;
	userSubjectFromAuthToken: string;
} => {
	const validation = Joi.object()
		.keys(fieldsFromAdminAuthentication)
		.validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};

export const validateIsAdminFromAuthentication: (
	data: unknown,
) => asserts data is {
	admin: boolean;
} = (
	data: unknown,
): asserts data is {
	admin: boolean;
} => {
	const validation = Joi.object()
		.keys({ admin: Joi.boolean().required() })
		.validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};

export const validateOptionalAuthenticationValues: (
	data: unknown,
) => asserts data is { emailFromAuthToken?: string; shareToken: string } = (
	data: unknown,
): asserts data is { emailFromAuthToken?: string; shareToken: string } => {
	const validation = Joi.object()
		.keys({
			emailFromAuthToken: Joi.string().email().optional(),
			shareToken: Joi.string().optional(),
		})
		.validate(data);

	if (validation.error !== undefined) {
		throw validation.error;
	}
};

export const validatePaginationParameters: (
	data: unknown,
) => asserts data is { cursor?: string; pageSize: number } = (
	data: unknown,
): asserts data is { cursor?: string; pageSize: number } => {
	const validation = Joi.object()
		.keys({
			cursor: Joi.string(),
			pageSize: Joi.number().integer().min(MINIMUM_PAGE_SIZE).required(),
		})
		.validate(data);

	if (validation.error !== undefined) {
		throw validation.error;
	}
};
