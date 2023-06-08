import Joi from "joi";
import type { CreateDirectiveRequest, UpdateDirectiveRequest } from "./model";
import { validateBodyFromAuthentication } from "../validators";

export { validateBodyFromAuthentication };

export const validateCreateDirectiveRequest = (
  data: unknown
): data is CreateDirectiveRequest => {
  const validation = Joi.object()
    .keys({
      emailFromAuthToken: Joi.string().email().required(),
      archiveId: Joi.string().required(),
      stewardEmail: Joi.when("type", {
        is: Joi.string().valid("transfer"),
        then: Joi.string().email().required(),
        otherwise: Joi.valid(null),
      }),
      type: Joi.string().required(),
      note: Joi.string().allow(""),
      trigger: Joi.object()
        .keys({
          type: Joi.string().required(),
        })
        .required(),
    })
    .validate(data);
  if (validation.error) {
    throw validation.error;
  }
  return true;
};

export const validateUpdateDirectiveParams = (
  data: unknown
): data is { directiveId: string } => {
  const validation = Joi.object()
    .keys({
      directiveId: Joi.string().uuid().required(),
    })
    .validate(data);
  if (validation.error) {
    throw validation.error;
  }
  return true;
};

export const validateUpdateDirectiveRequest = (
  data: unknown
): data is UpdateDirectiveRequest => {
  const validation = Joi.object()
    .keys({
      emailFromAuthToken: Joi.string().email().required(),
      stewardEmail: Joi.when("type", {
        is: Joi.string().valid("transfer"),
        then: Joi.string().email(),
        otherwise: Joi.valid(null),
      }),
      type: Joi.string(),
      note: Joi.string().allow(""),
      trigger: Joi.object().keys({
        type: Joi.string(),
      }),
    })
    .validate(data);
  if (validation.error) {
    throw validation.error;
  }
  return true;
};

export const validateTriggerAdminDirectivesParams = (
  data: unknown
): data is { accountId: string } => {
  const validation = Joi.object()
    .keys({
      accountId: Joi.string().required(),
    })
    .validate(data);
  if (validation.error) {
    throw validation.error;
  }
  return true;
};

export const validateGetDirectivesByArchiveIdParams = (
  data: unknown
): data is { archiveId: string } => {
  const validation = Joi.object()
    .keys({
      archiveId: Joi.string().required(),
    })
    .validate(data);
  if (validation.error) {
    throw validation.error;
  }
  return true;
};
