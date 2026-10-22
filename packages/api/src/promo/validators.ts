import Joi from "joi";
import type { ClaimPromoRequest, CreatePromoRequest } from "./models.js";

export const validateClaimPromoRequest: (
	data: unknown,
) => asserts data is ClaimPromoRequest = (
	data: unknown,
): asserts data is ClaimPromoRequest => {
	const validation = Joi.object()
		.keys({
			promoCode: Joi.string().required(),
		})
		.validate(data);

	if (validation.error !== undefined) {
		throw validation.error;
	}
};

const MINIMUM_STORAGE_AWARD = 1;
const MINIMUM_USES = 1;

export const validateCreatePromoRequest: (
	data: unknown,
) => asserts data is CreatePromoRequest = (
	data: unknown,
): asserts data is CreatePromoRequest => {
	const validation = Joi.object()
		.keys({
			code: Joi.string().required(),
			storageInMB: Joi.number().integer().min(MINIMUM_STORAGE_AWARD).required(),
			expirationTimestamp: Joi.date().iso().greater("now").required(),
			totalUses: Joi.number().integer().min(MINIMUM_USES).required(),
		})
		.validate(data);

	if (validation.error !== undefined) {
		throw validation.error;
	}
};
