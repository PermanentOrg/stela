import Joi from "joi";

export function validateGetPublicTagsParams(
  data: unknown
): asserts data is { archiveId: string } {
  const validation = Joi.object()
    .keys({ archiveId: Joi.string().required() })
    .validate(data);
  if (validation.error) {
    throw validation.error;
  }
}
