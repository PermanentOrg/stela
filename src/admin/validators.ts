import Joi from "joi";

export function validateRecalculateFolderThumbnailsRequest(
  data: unknown
): asserts data is { cutoffTimestamp: Date } {
  const validation = Joi.object()
    .keys({
      emailFromAuthToken: Joi.string().email().required(),
      cutoffTimestamp: Joi.date().iso().required(),
    })
    .validate(data);
  if (validation.error) {
    throw validation.error;
  }
}
