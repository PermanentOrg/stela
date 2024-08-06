import Joi from "joi";
import type { CreateDirectiveRequest, UpdateDirectiveRequest } from "./model";
import {
  validateBodyFromAuthentication,
  fieldsFromUserAuthentication,
} from "../validators";

export { validateBodyFromAuthentication };

export function validateCreateDirectiveRequest(
  data: unknown
): asserts data is CreateDirectiveRequest {
  const validation = Joi.object()
    .keys({
      ...fieldsFromUserAuthentication,
      archiveId: Joi.string().required(),
      stewardEmail: Joi.when("type", {
        is: Joi.string().valid("transfer"),
        then: Joi.string()
          .email()
          .invalid(Joi.ref("emailFromAuthToken"))
          .required(),
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
}

export function validateUpdateDirectiveParams(
  data: unknown
): asserts data is { directiveId: string } {
  const validation = Joi.object()
    .keys({
      directiveId: Joi.string().uuid().required(),
    })
    .validate(data);
  if (validation.error) {
    throw validation.error;
  }
}

export function validateUpdateDirectiveRequest(
  data: unknown
): asserts data is UpdateDirectiveRequest {
  const validation = Joi.object()
    .keys({
      ...fieldsFromUserAuthentication,
      stewardEmail: Joi.when("type", {
        is: Joi.string().valid("transfer"),
        then: Joi.string().invalid(Joi.ref("emailFromAuthToken")).email(),
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
}

export function validateTriggerAdminDirectivesParams(
  data: unknown
): asserts data is { accountId: string } {
  const validation = Joi.object()
    .keys({
      accountId: Joi.string().required(),
    })
    .validate(data);
  if (validation.error) {
    throw validation.error;
  }
}

export function validateGetDirectivesByArchiveIdParams(
  data: unknown
): asserts data is { archiveId: string } {
  const validation = Joi.object()
    .keys({
      archiveId: Joi.string().required(),
    })
    .validate(data);
  if (validation.error) {
    throw validation.error;
  }
}
