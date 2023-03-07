import Joi from "joi";
import type { CreateDirectiveRequest } from "./model";

export const validateCreateDirectiveRequest = (
  data: unknown
): data is CreateDirectiveRequest => {
  const validation = Joi.object()
    .keys({
      emailFromAuthToken: Joi.string().email().required(),
      archiveId: Joi.number().integer().min(1).required(),
      stewardAccountId: Joi.when("type", {
        is: Joi.string().valid("transfer"),
        then: Joi.number().integer().min(1).required(),
        otherwise: Joi.valid(null),
      }),
      type: Joi.string().required(),
      note: Joi.string(),
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

export const validateTriggerAdminDirectivesParams = (
  data: unknown
): data is { accountId: number } => {
  const validation = Joi.object()
    .keys({
      accountId: Joi.number().integer().min(1).required(),
    })
    .validate(data);
  if (validation.error) {
    throw validation.error;
  }
  return true;
};
