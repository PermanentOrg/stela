import Joi from "joi";
import type { GiftStorageRequest } from "./models";

export function validateGiftStorageRequest(
  data: unknown
): asserts data is GiftStorageRequest {
  const validation = Joi.object()
    .keys({
      emailFromAuthToken: Joi.string().email().required(),
      storageAmount: Joi.number().integer().min(1).required(),
      recipientEmails: Joi.array()
        .min(1)
        .items(Joi.string().email())
        .required(),
      note: Joi.string().allow("").optional(),
    })
    .validate(data);
  if (validation.error) {
    throw validation.error;
  }
}
