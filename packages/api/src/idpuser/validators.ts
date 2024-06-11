import Joi from "joi";
import type { SendEnableCodeRequest } from "./models";

export function validateSendEnableCodeRequest(
  data: unknown
): asserts data is SendEnableCodeRequest {
  const validation = Joi.object()
    .keys({
      emailFromAuthToken: Joi.string().email().required(),
      method: Joi.string().valid("email", "sms").required(),
      value: Joi.string().required().when("method", {
        is: "email",
        then: Joi.string().email(),
      }),
    })
    .validate(data);
  if (validation.error) {
    throw validation.error;
  }
}
