import Joi from "joi";
import { validateBodyFromAuthentication } from "../validators";

export { validateBodyFromAuthentication };

export const validateArchiveIdFromParams: (
	data: unknown,
) => asserts data is { archiveId: string } = (
	data: unknown,
): asserts data is { archiveId: string } => {
	const validation = Joi.object()
		.keys({ archiveId: Joi.string().required() })
		.validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};

export const validateSearchQuery: (data: unknown) => asserts data is {
	searchQuery: string;
	pageSize: number;
	cursor?: string;
} = (
	data: unknown,
): asserts data is {
	searchQuery: string;
	pageSize: number;
	cursor?: string;
} => {
	const validation = Joi.object()
		.keys({
			searchQuery: Joi.string().required(),
			pageSize: Joi.number().integer().min(1).required(),
			cursor: Joi.string().optional(),
		})
		.validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};
