import Joi from "joi";
import type { CreateEventRequest } from "./models";

export function validateCreateEventRequest(
  data: unknown
): asserts data is CreateEventRequest {
  const validation = Joi.object()
    .keys({
      userSubjectFromAuthToken: Joi.string().uuid(),
      adminSubjectFromAuthToken: Joi.string().uuid(),
      entity: Joi.string().required(),
      action: Joi.string().required(),
      version: Joi.number().required(),
      entityId: Joi.string().required(),
      ip: Joi.string().ip().required(),
      userAgent: Joi.string(),
      body: Joi.object()
        .keys({
          analytics: Joi.object().keys({
            event: Joi.string().required(),
            distinctId: Joi.string().required(),
            data: Joi.object().unknown(true).required(),
          }),
        })
        .unknown(true)
        .required(),
    })
    .or("userSubjectFromAuthToken", "adminSubjectFromAuthToken")
    .validate(data);
  if (validation.error) {
    throw validation.error;
  }
}
