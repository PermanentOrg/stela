import { logger } from "@stela/logger";

interface ArchivematicaConfig {
	archivematicaHostUrl: string;
	archivematicaApiKey: string;
	archivematicaOriginalLocationId: string;
	processingWorkflow: string;
}

export const getOriginalFileIdFromInformationPackagePath = (
	path: string,
): string => {
	// The path will inlude the substring /{fileId}_upload, which is what this regex looks for. The fileId is either
	// numeric or a UUID, so we expect it to consist of some hexadecimal digits and hyphens.
	const fileIdRegex =
		/access_copies(?:\/[0-9a-f]{4}){8}\/(?<fileId>\d+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})_upload/v;
	const match = fileIdRegex.exec(path);
	if (match?.groups?.["fileId"] === undefined) {
		logger.error(`Invalid file key: ${path}`);
		throw new Error("Invalid file key");
	}
	return match.groups["fileId"];
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
	config: ArchivematicaConfig,
): Promise<Response> => {
	validateCloudPath(fileCloudPath);
	return await fetch(`${config.archivematicaHostUrl}/api/v2beta/package`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `ApiKey ${config.archivematicaApiKey}`,
		},
		body: JSON.stringify({
			name: `${fileId}_upload`,
			type: "standard",
			processing_config: config.processingWorkflow,
			accession: "",
			access_system_id: "",
			auto_approve: true,
			metadata_set_id: "",
			path: Buffer.from(
				`${config.archivematicaOriginalLocationId}:${trimLastComponentFromCloudPath(fileCloudPath)}`,
				"utf-8",
			).toString("base64"),
		}),
	});
};
