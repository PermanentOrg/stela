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
