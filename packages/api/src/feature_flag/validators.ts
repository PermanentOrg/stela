import Joi from "joi";
import type {
	CreateFeatureFlagRequest,
	UpdateFeatureFlagRequest,
} from "./models";
import { fieldsFromAdminAuthentication } from "../validators";

export const validateCreateFeatureFlagRequest: (
	data: unknown,
) => asserts data is CreateFeatureFlagRequest = (
	data: unknown,
): asserts data is CreateFeatureFlagRequest => {
	const validation = Joi.object()
		.keys({
			...fieldsFromAdminAuthentication,
			name: Joi.string().required(),
			description: Joi.string().allow(null),
		})
		.validate(data);

	if (validation.error !== undefined) {
		throw validation.error;
	}
};

export const validateUpdateFeatureFlagRequest: (
	data: unknown,
) => asserts data is UpdateFeatureFlagRequest = (
	data: unknown,
): asserts data is UpdateFeatureFlagRequest => {
	const validation = Joi.object()
		.keys({
			...fieldsFromAdminAuthentication,
			description: Joi.string().allow(null),
			globallyEnabled: Joi.boolean().required(),
		})
		.validate(data);

	if (validation.error !== undefined) {
		throw validation.error;
	}
};

export const validateFeatureFlagParams: (
	data: unknown,
) => asserts data is { featureId: string } = (
	data: unknown,
): asserts data is { featureId: string } => {
	const validation = Joi.object()
		.keys({
			featureId: Joi.string().uuid().required(),
		})
		.validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};
