import Joi from "joi";

export function validateGetRecordRequest(
  data: unknown
): asserts data is { emailFromAuthToken: string } {
  const validation = Joi.object()
    .keys({
      emailFromAuthToken: Joi.required(),
    })
    .validate(data);
  if (validation.error) {
    throw validation.error;
  }
}
