import Joi from "joi";
import type {
	PaymentSheetRequest,
	DonationClaimStatusRequest,
	ClaimDonationRequest,
} from "./models";
import { fieldsFromUserAuthentication } from "../validators";

const MINIMUM_DONATION_CENTS = 100;

export const validatePaymentSheetRequest: (
	data: unknown,
) => asserts data is PaymentSheetRequest = (
	data: unknown,
): asserts data is PaymentSheetRequest => {
	const validation = Joi.object()
		.keys({
			...fieldsFromUserAuthentication,
			accountId: Joi.number().integer().positive().required(),
			amount: Joi.number().integer().min(MINIMUM_DONATION_CENTS).required(),
			email: Joi.string().email().required(),
			name: Joi.string().min(1).required(),
			anonymous: Joi.boolean().required(),
		})
		.validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};

export const validateDonationClaimStatusRequest: (
	data: unknown,
) => asserts data is DonationClaimStatusRequest = (
	data: unknown,
): asserts data is DonationClaimStatusRequest => {
	const validation = Joi.object()
		.keys({
			...fieldsFromUserAuthentication,
			donationId: Joi.number().integer().positive().required(),
		})
		.validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};

export const validateClaimDonationRequest: (
	data: unknown,
) => asserts data is ClaimDonationRequest = (
	data: unknown,
): asserts data is ClaimDonationRequest => {
	const validation = Joi.object()
		.keys({
			...fieldsFromUserAuthentication,
			donationId: Joi.number().integer().positive().required(),
		})
		.validate(data);
	if (validation.error !== undefined) {
		throw validation.error;
	}
};
