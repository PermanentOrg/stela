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

export function validateGetRecordQuery(
  data: unknown
): asserts data is { recordIds: string[] } {
  const validation = Joi.object()
      .keys({
        recordIds: Joi.required(),
      })
    .validate(data);
  if (validation.error) {
    throw validation.error;
  }
}
