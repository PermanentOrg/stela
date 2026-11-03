import createError from "http-errors";
import { logger } from "@stela/logger";
import { db } from "../database.js";
import type {
	Folder,
	ArchiveRecord,
	OriginalFile,
	ModernizeOriginalFileCloudpathsResult,
} from "./models.js";
import { publisherClient, lowPriorityTopicArn } from "@stela/publisher-utils";
import { constructSignedCdnUrl } from "@stela/s3-utils";
import { s3Service } from "../s3.js";

const CDN_URL_LIFETIME_YEARS = 1;

const recalculateFolderThumbnails = async (
	beginTimestamp: Date,
	endTimestamp: Date,
): Promise<{ messagesSent: number; failedFolders: string[] }> => {
	const folderResult = await db
		.sql<Folder>("admin.queries.get_folders_created_before_timestamp", {
			beginTimestamp,
			endTimestamp,
		})
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError("Failed to retrieve folders");
		});
	const { rows: folders } = folderResult;

	const publishResults = await publisherClient
		.batchPublishMessages(
			lowPriorityTopicArn,
			folders.map((folder) => ({
				id: folder.folderId,
				body: JSON.stringify({
					task: "task.thumbnail.folder",
					parameters: [
						"Thumbnail_Redo",
						folder.folderId,
						0,
						folder.archiveId,
						0,
						new Date().toISOString(),
					],
				}),
			})),
		)
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError("Failed to publish messages");
		});

	return {
		messagesSent: publishResults.messagesSent,
		failedFolders: publishResults.failedMessages,
	};
};

const recalculateRecordThumbnail = async (recordId: string): Promise<void> => {
	const recordResult = await db
		.sql<ArchiveRecord>("admin.queries.get_record", {
			recordId,
		})
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError("Failed to retrieve record");
		});

	if (recordResult.rows[0] === undefined) {
		throw new createError.NotFound("Record not found");
	}

	const publishResult = await publisherClient.batchPublishMessages(
		lowPriorityTopicArn,
		[
			{
				id: recordId,
				body: JSON.stringify({
					task: "task.thumbnail.record",
					parameters: [
						"Thumbnail_Redo",
						recordId,
						recordResult.rows[0].parentFolderId,
						recordResult.rows[0].archiveId,
						0,
						new Date().toISOString(),
					],
				}),
			},
		],
	);

	if (publishResult.failedMessages.length > 0) {
		throw new createError.InternalServerError("Failed to publish message");
	}
};

const setNullAccountSubjects = async (
	accounts: Array<{
		email: string;
		subject: string;
	}>,
): Promise<{ updatedAccounts: string[]; emailsWithErrors: string[] }> => {
	const updatedAccounts: string[] = [];
	const emailsWithErrors: string[] = [];
	await Promise.all(
		accounts.map(async (account) => {
			const result = await db
				.sql<{ accountId: string }>("admin.queries.set_null_account_subject", {
					email: account.email,
					subject: account.subject,
				})
				.catch((err: unknown) => {
					logger.error(err);
					emailsWithErrors.push(account.email);
					return null;
				});
			if (result?.rows[0] !== undefined) {
				updatedAccounts.push(result.rows[0].accountId);
			}
		}),
	);

	return {
		updatedAccounts,
		emailsWithErrors,
	};
};

const triggerOrphanedFolderDeletion = async (): Promise<{
	messagesSent: number;
	folderIdsWithErrors: string[];
}> => {
	const folderResult = await db
		.sql<{
			folderId: string;
			archiveNumber: string;
			archiveId: number;
			folderLinkId: number;
		}>("admin.queries.get_orphaned_folders")
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError("Failed to retrieve folders");
		});

	const { rows: folders } = folderResult;

	const publishResults = await publisherClient
		.batchPublishMessages(
			lowPriorityTopicArn,
			folders.map((folder) => ({
				id: folder.folderId,
				body: JSON.stringify({
					task: "task.folder.delete.all",
					parameters: [
						"Folder_Delete_ALL",
						folder.archiveNumber,
						folder.archiveId,
						folder.folderLinkId,
					],
				}),
			})),
		)
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError("Failed to publish messages");
		});

	return {
		messagesSent: publishResults.messagesSent,
		folderIdsWithErrors: publishResults.failedMessages,
	};
};

export const getModernOriginalFileCloudPath = (
	legacyCloudPath: string,
	fileId: string,
): string | null => {
	const match = new RegExp(`^(?<localPrefix>_[^\\/]+\\/)?${fileId}$`, "v").exec(
		legacyCloudPath,
	);
	if (match === null) {
		return null;
	}
	const localPrefix = match.groups?.["localPrefix"] ?? "";
	return `${localPrefix}originals/${fileId}/${fileId}`;
};

const modernizeOriginalFileCloudpath = async (
	fileId: string,
	result: ModernizeOriginalFileCloudpathsResult,
): Promise<void> => {
	const fileResult = await db.sql<OriginalFile>(
		"admin.queries.get_original_file",
		{
			fileId,
		},
	);
	const {
		rows: [file],
	} = fileResult;
	if (file === undefined) {
		result.skippedFiles.push({ fileId, reason: "File not found" });
		return;
	}
	if (file.format !== "file.format.original") {
		result.skippedFiles.push({ fileId, reason: "File is not an original" });
		return;
	}
	if (file.cloudPath === null) {
		result.skippedFiles.push({ fileId, reason: "File has no cloudpath" });
		return;
	}
	const { cloudPath: oldCloudPath } = file;
	const newCloudPath = getModernOriginalFileCloudPath(oldCloudPath, fileId);
	if (newCloudPath === null) {
		result.skippedFiles.push({
			fileId,
			reason: "Cloudpath is not in the legacy format",
		});
		return;
	}

	const urlExpirationTimestamp = new Date();
	urlExpirationTimestamp.setFullYear(
		urlExpirationTimestamp.getFullYear() + CDN_URL_LIFETIME_YEARS,
	);

	await db.transaction(async (transactionDb) => {
		const updateResult = await transactionDb.sql<{ fileId: string }>(
			"admin.queries.update_file_cloudpath",
			{
				fileId,
				oldCloudPath,
				newCloudPath,
				fileUrl: constructSignedCdnUrl(newCloudPath),
				downloadUrl:
					file.recordDownloadName === null
						? constructSignedCdnUrl(newCloudPath)
						: constructSignedCdnUrl(newCloudPath, file.recordDownloadName),
				urlExpirationTimestamp,
			},
		);
		if (updateResult.rows[0] === undefined) {
			throw new Error(`Cloudpath of file ${fileId} changed during update`);
		}
		await s3Service.copyObject(oldCloudPath, newCloudPath);
	});
	result.updatedFileIds.push(fileId);

	await s3Service.deleteObject(oldCloudPath).catch((err: unknown) => {
		logger.error(err);
		result.fileIdsWithUndeletedOldObjects.push(fileId);
	});
};

const modernizeOriginalFileCloudpaths = async (
	fileIds: string[],
): Promise<ModernizeOriginalFileCloudpathsResult> => {
	const result: ModernizeOriginalFileCloudpathsResult = {
		updatedFileIds: [],
		skippedFiles: [],
		fileIdsWithErrors: [],
		fileIdsWithUndeletedOldObjects: [],
	};
	// Files are processed one at a time because each transaction holds a
	// database connection open while its S3 copy runs; processing them in
	// parallel could exhaust the connection pool for the whole API. Chaining
	// each file's work onto the previous file's promise enforces that ordering.
	await fileIds.reduce(async (previousFiles, fileId) => {
		await previousFiles;
		await modernizeOriginalFileCloudpath(fileId, result).catch(
			(err: unknown) => {
				logger.error(err);
				result.fileIdsWithErrors.push(fileId);
			},
		);
	}, Promise.resolve());
	return result;
};

export const adminService = {
	recalculateFolderThumbnails,
	recalculateRecordThumbnail,
	setNullAccountSubjects,
	triggerOrphanedFolderDeletion,
	modernizeOriginalFileCloudpaths,
};
