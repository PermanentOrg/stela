import Joi from "joi";
import type { CreateLegacyContactRequest } from "./model";
import { validateBodyFromAuthentication } from "../validators";

export { validateBodyFromAuthentication };

export function validateCreateLegacyContactRequest(
  data: unknown
): asserts data is CreateLegacyContactRequest {
  const validation = Joi.object()
    .keys({
      emailFromAuthToken: Joi.string().email().required(),
      email: Joi.string()
        .email()
        .invalid(Joi.ref("emailFromAuthToken"))
        .required(),
      name: Joi.string().required(),
    })
    .validate(data);
  if (validation.error) {
    throw validation.error;
  }
}

export function validateUpdateLegacyContactRequest(
  data: unknown
): asserts data is CreateLegacyContactRequest {
  const validation = Joi.object()
    .keys({
      emailFromAuthToken: Joi.string().email().required(),
      email: Joi.string().email().invalid(Joi.ref("emailFromAuthToken")),
      name: Joi.string(),
    })
    .validate(data);
  if (validation.error) {
    throw validation.error;
  }
}

export function validateUpdateLegacyContactParams(
  data: unknown
): asserts data is { legacyContactId: string } {
  const validation = Joi.object()
    .keys({
      legacyContactId: Joi.string().uuid().required(),
    })
    .validate(data);
  if (validation.error) {
    throw validation.error;
  }
}
