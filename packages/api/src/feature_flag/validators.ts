import Joi from "joi";
import type { CreateFeatureFlagRequest } from "./models";
import { fieldsFromAdminAuthentication } from "../validators";

export function validateCreateFeatureFlagRequest(
  data: unknown
): asserts data is CreateFeatureFlagRequest {
  const validation = Joi.object()
    .keys({
      ...fieldsFromAdminAuthentication,
      name: Joi.string().required(),
      description: Joi.string(),
    })
    .validate(data);

  if (validation.error) {
    throw validation.error;
  }
}
