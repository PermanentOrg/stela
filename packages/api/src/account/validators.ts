import Joi from "joi";
import type { UpdateTagsRequest } from "./models";
import {
	fieldsFromUserAuthentication,
	validateBodyFromAuthentication,
} from "../validators";

export { validateBodyFromAuthentication };

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
						.regex(/^[1-9]\d*$/)
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
