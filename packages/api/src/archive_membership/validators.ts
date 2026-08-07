import Joi from "joi";
import type { UpdateArchiveMembershipRequest } from "./models.js";
import { fieldsFromUserAuthentication } from "../validators/index.js";
import { ArchiveMembershipRole } from "../access/models.js";

export const validateUpdateArchiveMembershipRequest: (
	data: unknown,
) => asserts data is UpdateArchiveMembershipRequest = (
	data: unknown,
): asserts data is UpdateArchiveMembershipRequest => {
	const validation = Joi.object()
		.keys({
			...fieldsFromUserAuthentication,
			accessRole: Joi.string()
				.valid(
					...Object.values(ArchiveMembershipRole).filter(
						(role) => role !== ArchiveMembershipRole.Owner,
					),
				)
				.optional(),
			status: Joi.string().valid("ok").optional(),
			ip: Joi.string().ip().optional(),
		})
		.or("accessRole", "status")
		.validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};

export const validateArchiveMembershipIdParams: (
	data: unknown,
) => asserts data is {
	id: string;
} = (data: unknown): asserts data is { id: string } => {
	const validation = Joi.object()
		.keys({ id: Joi.string().required() })
		.validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};
