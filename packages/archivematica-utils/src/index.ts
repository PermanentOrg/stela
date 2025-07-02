import { logger } from "@stela/logger";

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

const validateCloudPath = (cloudPath: string): void => {
	if (!cloudPath.includes("/")) {
		throw new Error(
			"Invalid cloud path: file must be located in a non-root directory",
		);
	}
};

const trimLastComponentFromCloudPath = (cloudPath: string): string =>
	cloudPath.substring(0, cloudPath.lastIndexOf("/"));

export const triggerArchivematicaProcessing = async (
	fileId: string,
	fileCloudPath: string,
	archivematicaHostUrl: string,
	archivematicaApiKey: string,
	archivematicaOriginalLocationId: string,
): Promise<Response> => {
	validateCloudPath(fileCloudPath);
	return fetch(`${archivematicaHostUrl}/api/v2beta/package`, {
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
				`${archivematicaOriginalLocationId}:${trimLastComponentFromCloudPath(fileCloudPath)}`,
				"utf-8",
			).toString("base64"),
		}),
	});
};
