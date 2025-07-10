import { parse } from "path";
import { logger } from "@stela/logger";
import { getFileExtensionByFileType } from "@stela/permanent_models";
import { constructSignedCdnUrl } from "@stela/s3-utils";
import type { FileType } from "@stela/permanent_models";
import { db } from "./database";

interface FileData {
	id: string;
	cloudPath: string;
	uploadName: string;
	type: FileType;
	format:
		| "file.format.1920x1080"
		| "file.format.archivematica.access"
		| "file.format.converted"
		| "file.format.original";
}

export const refreshFileUrls = async (): Promise<void> => {
	const filesToRefreshUrls = await db
		.sql<FileData>("queries.get_files_where_urls_expire_soon")
		.catch((err: unknown) => {
			logger.error(err);
			throw err;
		});
	await Promise.all(
		filesToRefreshUrls.rows.map(async (file) => {
			const newAccessUrl =
				file.cloudPath !== null ? constructSignedCdnUrl(file.cloudPath) : null;
			const newDownloadUrl = constructSignedCdnUrl(
				file.cloudPath,
				file.format === "file.format.original"
					? file.uploadName
					: `${parse(file.uploadName).name}.${getFileExtensionByFileType(file.type)}`,
			);
			try {
				await db.sql("queries.update_file_url", {
					url: newAccessUrl,
					downloadUrl: newDownloadUrl,
					fileId: file.id,
				});
			} catch (err: unknown) {
				logger.error(err);
			}
		}),
	);
	if (filesToRefreshUrls.rows.length !== 0) {
		await refreshFileUrls();
	}
};
