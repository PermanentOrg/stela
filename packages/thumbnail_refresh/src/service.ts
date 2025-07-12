import { getSignedUrl } from "aws-cloudfront-sign";
import { logger } from "@stela/logger";
import { db } from "./database";

const thumbnail200Suffix = ".thumb.w200";
const thumbnail500Suffix = ".thumb.w500";
const thumbnail1000Suffix = ".thumb.w1000";
const thumbnail2000Suffix = ".thumb.w2000";

interface ThumbnailData {
	id: string;
	itemType: "folder" | "record";
	archiveNumber: string;
	thumbnail256CloudPath?: string;
	thumbnail256?: string;
	thumbnail200?: string;
	thumbnail500?: string;
	thumbnail1000?: string;
	thumbnail2000?: string;
}

const constructSignedCdnUrl = (key: string): string => {
	const expirationTime = new Date();
	expirationTime.setFullYear(expirationTime.getFullYear() + 1);

	return getSignedUrl(`${process.env["CLOUDFRONT_URL"] ?? ""}${key}`, {
		expireTime: expirationTime.getTime(),
		keypairId: process.env["CLOUDFRONT_KEY_PAIR_ID"] ?? "",
		privateKeyString: process.env["CLOUDFRONT_PRIVATE_KEY"] ?? "",
	});
};

export const refreshThumbnails = async (): Promise<void> => {
	const itemsToRefreshThumbnails = await db
		.sql<ThumbnailData>("queries.get_items_where_thumbnails_expire_soon")
		.catch((err: unknown) => {
			logger.error(err);
			throw err;
		});
	await Promise.all(
		itemsToRefreshThumbnails.rows.map(async (item) => {
			const newThumbnail256 =
				item.thumbnail256 != null && item.thumbnail256CloudPath != null
					? constructSignedCdnUrl(item.thumbnail256CloudPath)
					: null;
			const newThumbnail200 =
				item.thumbnail200 != null
					? constructSignedCdnUrl(item.archiveNumber + thumbnail200Suffix)
					: null;
			const newThumbnail500 =
				item.thumbnail500 != null
					? constructSignedCdnUrl(item.archiveNumber + thumbnail500Suffix)
					: null;
			const newThumbnail1000 =
				item.thumbnail1000 != null
					? constructSignedCdnUrl(item.archiveNumber + thumbnail1000Suffix)
					: null;
			const newThumbnail2000 =
				item.thumbnail2000 != null
					? constructSignedCdnUrl(item.archiveNumber + thumbnail2000Suffix)
					: null;
			try {
				if (item.itemType === "record") {
					await db.sql("queries.update_record_thumbnails", {
						thumbnail256: newThumbnail256,
						thumbnail200: newThumbnail200,
						thumbnail500: newThumbnail500,
						thumbnail1000: newThumbnail1000,
						thumbnail2000: newThumbnail2000,
						recordId: item.id,
					});
				} else {
					await db.sql("queries.update_folder_thumbnails", {
						thumbnail256: newThumbnail256,
						thumbnail200: newThumbnail200,
						thumbnail500: newThumbnail500,
						thumbnail1000: newThumbnail1000,
						thumbnail2000: newThumbnail2000,
						folderId: item.id,
					});
				}
			} catch (err: unknown) {
				logger.error(err);
			}
		}),
	);
};
