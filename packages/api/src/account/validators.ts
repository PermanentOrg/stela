import Joi from "joi";
import type {
	CreateStorageAdjustmentRequest,
	PostMarketingTagsRequest,
	UpdateTagsRequest,
	GetAccountsQuery,
} from "./models.js";
import {
	fieldsFromUserAuthentication,
	fieldsFromAdminAuthentication,
	validateBodyFromAuthentication,
	validateBodyFromAdminAuthentication,
} from "../validators/index.js";
import { paginationFields } from "../validators/shared.js";

export { validateBodyFromAuthentication, validateBodyFromAdminAuthentication };

export const validateUpdateTagsRequest: (
	data: unknown,
) => asserts data is UpdateTagsRequest = (
	data: unknown,
): asserts data is UpdateTagsRequest => {
	const validation = Joi.object()
		.keys({
			...fieldsFromUserAuthentication,
			addTags: Joi.array().items(Joi.string()),
			removeTags: Joi.array().items(Joi.string()),
		})
		.or("addTags", "removeTags")
		.validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};

export const validateLeaveArchiveParams: (
	data: unknown,
) => asserts data is { archiveId: string } = (
	data: unknown,
): asserts data is { archiveId: string } => {
	const validation = Joi.object()
		.keys({
			archiveId: Joi.alternatives()
				.try(
					Joi.string()
						.regex(/^[1-9]\d*$/v)
						.required(),
					Joi.string().uuid(),
				)
				.required(),
		})
		.validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};

export const validateLeaveArchiveRequest: (data: unknown) => asserts data is {
	ip: string;
	emailFromAuthToken: string;
	userSubjectFromAuthToken: string;
} = (
	data: unknown,
): asserts data is {
	ip: string;
	emailFromAuthToken: string;
	userSubjectFromAuthToken: string;
} => {
	const validation = Joi.object()
		.keys({
			...fieldsFromUserAuthentication,
			ip: Joi.string().ip().required(),
		})
		.validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};

export const validateCreateStorageAdjustmentRequest: (
	data: unknown,
) => asserts data is CreateStorageAdjustmentRequest = (
	data: unknown,
): asserts data is CreateStorageAdjustmentRequest => {
	const validation = Joi.object()
		.keys({
			...fieldsFromAdminAuthentication,
			storageAmount: Joi.number().integer().not(0).required(),
		})
		.validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};

export const validateGetAccountsQuery: (
	data: unknown,
) => asserts data is GetAccountsQuery = (
	data: unknown,
): asserts data is GetAccountsQuery => {
	const validation = Joi.object()
		.keys({
			...paginationFields,
			accountIds: Joi.alternatives()
				.try(Joi.string(), Joi.array().items(Joi.string()))
				.optional(),
			accountEmails: Joi.alternatives()
				.try(Joi.string().email(), Joi.array().items(Joi.string().email()))
				.optional(),
		})
		.xor("accountIds", "accountEmails")
		.validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};

export const validatePostMarketingTagsRequest: (
	data: unknown,
) => asserts data is PostMarketingTagsRequest = (
	data: unknown,
): asserts data is PostMarketingTagsRequest => {
	const validation = Joi.object()
		.keys({
			...fieldsFromUserAuthentication,
			tags: Joi.array().items(Joi.string()).min(1).required(),
		})
		.validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};

export const validateCreateStorageAdjustmentParams: (
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
