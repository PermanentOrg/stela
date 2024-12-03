import Joi from "joi";
import type { CopyRecordRequest, PatchRecordRequest } from "./models";
import { fieldsFromUserAuthentication } from "../validators";

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
export function validateRecordRequest(
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

export function validatePatchRecordRequest(
  data: unknown
): asserts data is PatchRecordRequest {
  const validation = Joi.object()
    .keys({
      ...fieldsFromUserAuthentication,
      locationId: Joi.number().integer().optional().allow(null),
      description: Joi.string().optional().allow(null),
    })
    .validate(data);

  if (validation.error) {
    throw validation.error;
  }
}

export function validateCopyRecordRequest(
  data: unknown
): asserts data is CopyRecordRequest {
  const validation = Joi.object()
    .keys({
      ...fieldsFromUserAuthentication,
      RecordVO: {
        recordId: Joi.number().integer().required(),
        archiveNbr: Joi.string().optional().allow(null),
        folder_linkId: Joi.number().integer().optional().allow(null),
        parentFolder_linkId: Joi.number().integer().optional().allow(null),
        parentFolderId: Joi.number().integer().optional().allow(null),
        folderId: Joi.number().integer().optional().allow(null),
        uploadFileName: Joi.string().optional().allow(null),
      },
      FolderDestVO: { folder_linkId: Joi.number().integer().required() },
      archiveId: Joi.number().integer().optional().allow(null),
    })
    .validate(data);

  if (validation.error) {
    throw validation.error;
  }
}
