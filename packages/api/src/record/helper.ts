import type { PatchRecordRequest, RecordColumnsForUpdate } from "./models";

export const requestFieldsToDatabaseFields = (
	request: PatchRecordRequest,
	recordId: string,
): RecordColumnsForUpdate => ({
	locnid: request.locationId,
	description: request.description,
	recordId,
});
