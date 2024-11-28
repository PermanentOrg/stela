import type { PatchRecordRequest, RecordColumnsForUpdate } from "./models";

export function requestFieldsToDatabaseFields(
  request: PatchRecordRequest,
  recordId: string
): RecordColumnsForUpdate {
  return {
    locnid: request.locationId,
    description: request.description,
    recordId,
  };
}
