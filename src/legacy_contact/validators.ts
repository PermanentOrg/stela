import Joi from "joi";
import type { CreateLegacyContactRequest } from "./model";
import { validateBodyFromAuthentication } from "../validators";

export { validateBodyFromAuthentication };

export const validateCreateLegacyContactRequest = (
  data: unknown
): data is CreateLegacyContactRequest => {
  const validation = Joi.object()
    .keys({
      emailFromAuthToken: Joi.string().email().required(),
      email: Joi.string().email().required(),
      name: Joi.string().required(),
    })
    .validate(data);
  if (validation.error) {
    throw validation.error;
  }
  return true;
};

export const validateUpdateLegacyContactRequest = (
  data: unknown
): data is CreateLegacyContactRequest => {
  const validation = Joi.object()
    .keys({
      emailFromAuthToken: Joi.string().email().required(),
      email: Joi.string().email(),
      name: Joi.string(),
    })
    .validate(data);
  if (validation.error) {
    throw validation.error;
  }
  return true;
};

export const validateUpdateLegacyContactParams = (
  data: unknown
): data is { legacyContactId: string } => {
  const validation = Joi.object()
    .keys({
      legacyContactId: Joi.string().uuid().required(),
    })
    .validate(data);
  if (validation.error) {
    throw validation.error;
  }
  return true;
};
