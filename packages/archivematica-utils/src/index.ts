import fetch from "node-fetch";
import type { Response } from "node-fetch";
import { logger } from "@stela/logger";

const archivematicaHostUrl = process.env["ARCHIVEMATICA_HOST_URL"] ?? "";
const archivematicaApiKey = process.env["ARCHIVEMATICA_API_KEY"] ?? "";
const archivematicaOriginalLocationId =
	process.env["ARCHIVEMATICA_ORIGINAL_LOCATION_ID"] ?? "";

export const getOriginalFileIdFromInformationPackagePath = (
	path: string,
): string => {
	// The path will inlude the substring /{fileId}_upload, which is what this regex looks for. The fileId is either
	// numeric or a UUID, so we expect it to consist of some hexadecimal digits and hyphens.
	const fileIdRegex =
		/access_copies(?:\/[0-9a-f]{4}){8}\/(\d+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})_upload/;
	const match = fileIdRegex.exec(path);
	if (match === null || match[1] === undefined) {
		logger.error(`Invalid file key: ${path}`);
		throw new Error("Invalid file key");
	}
	return match[1];
};

export const triggerArchivematicaProcessing = async (
	fileId: string,
	fileCloudPath: string,
): Promise<Response> => {
	const response = await fetch(`${archivematicaHostUrl}/api/v2beta/package`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `ApiKey ${archivematicaApiKey}`,
		},
		body: JSON.stringify({
			name: `${fileId}_upload`,
			type: "standard",
			processing_config: "default",
			accession: "",
			access_system_id: "",
			auto_approve: true,
			metadata_set_id: "",
			path: Buffer.from(
				`${archivematicaOriginalLocationId}${fileCloudPath.substring(0, fileCloudPath.lastIndexOf("/")) ? fileCloudPath.substring(0, fileCloudPath.lastIndexOf("/")) : fileCloudPath}`,
				"utf-8",
			).toString("base64"),
		}),
	});

	return response;
};
