import Joi from "joi";
import type { UpdateTagsRequest } from "./models";
import { validateBodyFromAuthentication } from "../validators";

export { validateBodyFromAuthentication };

export function validateUpdateTagsRequest(
  data: unknown
): asserts data is UpdateTagsRequest {
  const validation = Joi.object()
    .keys({
      emailFromAuthToken: Joi.string().email().required(),
      addTags: Joi.array().items(Joi.string()),
      removeTags: Joi.array().items(Joi.string()),
    })
    .or("addTags", "removeTags")
    .validate(data);
  if (validation.error) {
    throw validation.error;
  }
}

export function validateLeaveArchiveParams(
  data: unknown
): asserts data is { archiveId: string } {
  const validation = Joi.object()
    .keys({
      archiveId: Joi.string()
        .regex(/^[1-9]\d+$/)
        .required(),
    })
    .validate(data);
  if (validation.error) {
    throw validation.error;
  }
}
