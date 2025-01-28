import Joi from "joi";
import type { PatchRecordRequest } from "./models";
import { fieldsFromUserAuthentication } from "../validators";

export function validateGetRecordQuery(
  data: unknown
): asserts data is { recordIds: string[] } {
  const validation = Joi.object()
    .keys({
      recordIds: Joi.array().items(Joi.string().required()).required(),
    })
    .validate(data);
  if (validation.error) {
    throw validation.error;
  }
}
export function validateRecordRequest(
  data: unknown
): asserts data is { recordId: string } {
  const validation = Joi.object()
    .keys({
      recordId: Joi.string().required(),
    })
    .validate(data);
  if (validation.error) {
    throw validation.error;
  }
}

export function validatePatchRecordRequest(
  data: unknown
): asserts data is PatchRecordRequest {
  const validation = Joi.object()
    .keys({
      ...fieldsFromUserAuthentication,
      locationId: Joi.number().integer().optional().allow(null),
      description: Joi.string().optional().allow(null),
    })
    .validate(data);

  if (validation.error) {
    throw validation.error;
  }
}

export function validateGetRecordRequestBody(
  data: unknown
): asserts data is { emailFromAuthToken?: string; shareToken: string } {
  const validation = Joi.object()
    .keys({
      emailFromAuthToken: Joi.string().email().optional(),
      shareToken: Joi.string().optional(),
    })
    .validate(data);

  if (validation.error) {
    throw validation.error;
  }
}
