import Joi from "joi";
import type {
	CreateFeatureFlagRequest,
	UpdateFeatureFlagRequest,
} from "./models";
import { fieldsFromAdminAuthentication } from "../validators";

export function validateCreateFeatureFlagRequest(
	data: unknown,
): asserts data is CreateFeatureFlagRequest {
	const validation = Joi.object()
		.keys({
			...fieldsFromAdminAuthentication,
			name: Joi.string().required(),
			description: Joi.string().allow(null),
		})
		.validate(data);

	if (validation.error) {
		throw validation.error;
	}
}

export function validateUpdateFeatureFlagRequest(
	data: unknown,
): asserts data is UpdateFeatureFlagRequest {
	const validation = Joi.object()
		.keys({
			...fieldsFromAdminAuthentication,
			description: Joi.string().allow(null),
			globallyEnabled: Joi.boolean().required(),
		})
		.validate(data);

	if (validation.error) {
		throw validation.error;
	}
}

export function validateFeatureFlagParams(
	data: unknown,
): asserts data is { featureId: string } {
	const validation = Joi.object()
		.keys({
			featureId: Joi.string().uuid().required(),
		})
		.validate(data);
	if (validation.error) {
		throw validation.error;
	}
}
