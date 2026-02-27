import Joi from "joi";
import type { StoragePurchaseRequest } from "./models";
import { fieldsFromUserAuthentication } from "../validators";

const MINIMUM_PURCHASE_AMOUNT_IN_USD = 1;

export const validateStoragePurchaseRequest: (
	data: unknown,
) => asserts data is StoragePurchaseRequest = (
	data: unknown,
): asserts data is StoragePurchaseRequest => {
	const validation = Joi.object()
		.keys({
			...fieldsFromUserAuthentication,
			amountInUSD: Joi.number()
				.integer()
				.min(MINIMUM_PURCHASE_AMOUNT_IN_USD)
				.required(),
		})
		.validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};
