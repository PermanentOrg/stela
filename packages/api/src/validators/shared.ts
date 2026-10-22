import Joi from "joi";

const MINIMUM_PAGE_SIZE = 1;

export const paginationFields = {
	cursor: Joi.string(),
	pageSize: Joi.number().integer().min(MINIMUM_PAGE_SIZE).required(),
};

const userAuthenticationSchema = Joi.object().keys({
	kind: Joi.string().valid("user").required(),
	email: Joi.string().email().required(),
	subject: Joi.string().uuid().required(),
	shareToken: Joi.string().optional(),
});

const adminAuthenticationSchema = Joi.object().keys({
	kind: Joi.string().valid("admin").required(),
	email: Joi.string().email().required(),
	subject: Joi.string().uuid().required(),
	shareToken: Joi.string().optional(),
});

export interface UserAuthentication {
	kind: "user";
	email: string;
	subject: string;
	shareToken?: string;
}

export interface AdminAuthentication {
	kind: "admin";
	email: string;
	subject: string;
	shareToken?: string;
}

export type UserOrAdminAuthentication =
	| UserAuthentication
	| AdminAuthentication;

export interface OptionalAuthentication {
	kind?: "user" | undefined;
	email?: string | undefined;
	shareToken?: string | undefined;
}

export const validateUserAuthentication: (
	data: unknown,
) => asserts data is UserAuthentication = (
	data: unknown,
): asserts data is UserAuthentication => {
	const validation = userAuthenticationSchema.required().validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};

export const validateAdminAuthentication: (
	data: unknown,
) => asserts data is AdminAuthentication = (
	data: unknown,
): asserts data is AdminAuthentication => {
	const validation = adminAuthenticationSchema.required().validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};

export const validateUserOrAdminAuthentication: (
	data: unknown,
) => asserts data is UserOrAdminAuthentication = (
	data: unknown,
): asserts data is UserOrAdminAuthentication => {
	const validation = Joi.alternatives()
		.try(userAuthenticationSchema, adminAuthenticationSchema)
		.required()
		.validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};

export const validateOptionalAuthentication: (
	data: unknown,
) => asserts data is OptionalAuthentication = (
	data: unknown,
): asserts data is OptionalAuthentication => {
	const validation = Joi.object()
		.keys({
			kind: Joi.string().valid("user").optional(),
			email: Joi.string().email().optional(),
			shareToken: Joi.string().optional(),
		})
		.validate(data);

	if (validation.error !== undefined) {
		throw validation.error;
	}
};

export const validateClientIp: (data: unknown) => asserts data is string = (
	data: unknown,
): asserts data is string => {
	const validation = Joi.string().ip().required().validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};

export const validatePaginationParameters: (
	data: unknown,
) => asserts data is { cursor?: string; pageSize: number } = (
	data: unknown,
): asserts data is { cursor?: string; pageSize: number } => {
	const validation = Joi.object().keys(paginationFields).validate(data);

	if (validation.error !== undefined) {
		throw validation.error;
	}
};
