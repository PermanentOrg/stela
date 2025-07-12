import Joi from "joi";
import type { GiftStorageRequest } from "./models";
import { fieldsFromUserAuthentication } from "../validators";

const MINIMUM_GIFT_AMOUNT = 1;
const MINIMUM_GIFT_RECIPIENTS = 1;

export const validateGiftStorageRequest: (
	data: unknown,
) => asserts data is GiftStorageRequest = (
	data: unknown,
): asserts data is GiftStorageRequest => {
	const validation = Joi.object()
		.keys({
			...fieldsFromUserAuthentication,
			storageAmount: Joi.number().integer().min(MINIMUM_GIFT_AMOUNT).required(),
			recipientEmails: Joi.array()
				.min(MINIMUM_GIFT_RECIPIENTS)
				.items(Joi.string().email())
				.required(),
			note: Joi.string().allow("").optional(),
		})
		.validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};
