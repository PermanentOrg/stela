import Joi from "joi";
import type { CreateShareLinkRequest, UpdateShareLinkRequest } from "./models";
import { fieldsFromUserAuthentication } from "../validators";

const MINIMUM_MAX_USES = 1;

export const validateCreateShareLinkRequest: (
	data: unknown,
) => asserts data is CreateShareLinkRequest = (
	data: unknown,
): asserts data is CreateShareLinkRequest => {
	const validation = Joi.object()
		.keys({
			...fieldsFromUserAuthentication,
			itemId: Joi.string().required(),
			itemType: Joi.string().required().valid("record", "folder"),
			permissionsLevel: Joi.string()
				.when("accessRestrictions", {
					is: Joi.exist(),
					then: Joi.when("accessRestrictions", {
						is: "none",
						then: Joi.valid("viewer"),
						otherwise: Joi.valid(
							"viewer",
							"editor",
							"contributor",
							"manager",
							"owner",
						),
					}),
					otherwise: Joi.valid("viewer"),
				})
				.optional(),
			accessRestrictions: Joi.string()
				.valid("none", "account", "approval")
				.optional(),
			maxUses: Joi.number()
				.integer()
				.min(MINIMUM_MAX_USES)
				.when("accessRestrictions", {
					is: Joi.exist(),
					then: Joi.when("accessRestrictions", {
						is: "none",
						then: Joi.forbidden(),
						otherwise: Joi.optional(),
					}),
					otherwise: Joi.forbidden(),
				}),
			expirationTimestamp: Joi.string().isoDate().optional(),
		})
		.validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};

export const validateUpdateShareLinkRequest: (
	data: unknown,
) => asserts data is UpdateShareLinkRequest = (
	data: unknown,
): asserts data is UpdateShareLinkRequest => {
	const validation = Joi.object()
		.keys({
			...fieldsFromUserAuthentication,
			permissionsLevel: Joi.string()
				.when("accessRestrictions", {
					is: "none",
					then: Joi.valid("viewer"),
					otherwise: Joi.valid(
						"viewer",
						"editor",
						"contributor",
						"manager",
						"owner",
					),
				})
				.optional(),
			accessRestrictions: Joi.string()
				.valid("none", "account", "approval")
				.optional(),
			expirationTimestamp: Joi.string().isoDate().allow(null).optional(),
			maxUses: Joi.number()
				.integer()
				.min(MINIMUM_MAX_USES)
				.allow(null)
				.when("accessRestrictions", { is: "none", then: Joi.valid(null) })
				.optional(),
		})
		.or(
			"permissionsLevel",
			"accessRestrictions",
			"expirationTimestamp",
			"maxUses",
		)
		.validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};

export const validateGetShareLinksParameters: (
	data: unknown,
) => asserts data is {
	shareTokens: string[] | undefined;
	shareLinkIds: string[] | undefined;
} = (
	data: unknown,
): asserts data is {
	shareTokens: string[] | undefined;
	shareLinkIds: string[] | undefined;
} => {
	const validation = Joi.object()
		.keys({
			shareTokens: Joi.array().items(Joi.string()).optional(),
			shareLinkIds: Joi.array().items(Joi.string()).optional(),
		})
		.validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};
