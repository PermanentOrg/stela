import Joi from "joi";
import type { CreatePromoRequest } from "./models";
import { fieldsFromAdminAuthentication } from "../validators";

export function validateCreatePromoRequest(
  data: unknown
): asserts data is CreatePromoRequest {
  const validation = Joi.object()
    .keys({
      ...fieldsFromAdminAuthentication,
      code: Joi.string().required(),
      storageInMB: Joi.number().integer().min(1).required(),
      expirationTimestamp: Joi.date().iso().greater("now").required(),
      totalUses: Joi.number().integer().min(1).required(),
    })
    .validate(data);

  if (validation.error) {
    throw validation.error;
  }
}
