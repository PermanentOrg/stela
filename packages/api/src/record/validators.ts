import Joi from "joi";

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
