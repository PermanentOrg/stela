import Joi from "joi";
import type { UpdateTagsRequest } from "./models";

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
