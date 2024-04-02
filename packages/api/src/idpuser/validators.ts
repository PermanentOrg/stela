/** @format */
import Joi from "joi";

export function validateTokenFromBody(
  data: unknown
): asserts data is { token: string } {
  const validation = Joi.object()
    .keys({
      token: Joi.string().required(),
      emailFromAuthToken: Joi.string().email().required(),
    })
    .validate(data);
  if (validation.error) {
    throw validation.error;
  }
}
