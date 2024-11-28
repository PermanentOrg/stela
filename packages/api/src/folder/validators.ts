import Joi from "joi";
import type { PatchFolderRequest } from "./models";
import { fieldsFromUserAuthentication } from "../validators";

export function validateFolderRequest(
  data: unknown
): asserts data is { folderId: string } {
  const validation = Joi.object()
    .keys({
      folderId: Joi.string().required(),
    })
    .validate(data);
  if (validation.error) {
    throw validation.error;
  }
}

export function validatePatchFolderRequest(
  data: unknown
): asserts data is PatchFolderRequest {
  const validation = Joi.object()
    .keys({
      ...fieldsFromUserAuthentication,
      archiveNumber: Joi.string().optional().allow(null),
      archiveId: Joi.number().integer().optional().allow(null),
      displayDate: Joi.string().optional().allow(null),
      displayEndDate: Joi.string().optional().allow(null),
    })
    .validate(data);

  if (validation.error) {
    throw validation.error;
  }
}
