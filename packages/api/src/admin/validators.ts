import Joi from "joi";

export function validateRecalculateFolderThumbnailsRequest(
  data: unknown
): asserts data is { beginTimestamp: Date; endTimestamp: Date } {
  const validation = Joi.object()
    .keys({
      emailFromAuthToken: Joi.string().email().required(),
      beginTimestamp: Joi.date().iso().required(),
      endTimestamp: Joi.date().iso().required(),
    })
    .validate(data);
  if (validation.error) {
    throw validation.error;
  }
}

export function validateAccountSetNullSubjectsRequest(
  data: unknown
): asserts data is { accounts: { email: string; subject: string }[] } {
  const validation = Joi.object()
    .keys({
      emailFromAuthToken: Joi.string().email().required(),
      accounts: Joi.array()
        .items(
          Joi.object({
            email: Joi.string().email().required(),
            subject: Joi.string().uuid().required(),
          })
        )
        .required(),
    })
    .validate(data);
  if (validation.error) {
    throw validation.error;
  }
}

export function validateRecalculateRecordThumbnailRequest(
  data: unknown
): asserts data is { recordId: string } {
  const validation = Joi.object()
    .keys({
      recordId: Joi.string().required(),
    })
    .validate(data);
  if (validation.error) {
    throw validation.error;
  }
}
