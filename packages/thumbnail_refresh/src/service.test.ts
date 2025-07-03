import { getSignedUrl } from "aws-cloudfront-sign";
import { logger } from "@stela/logger";
import { refreshThumbnails } from "./service";
import { db } from "./database";

jest.mock("aws-cloudfront-sign");
jest.mock("@stela/logger");
jest.mock("./database");

interface ThumbnailData {
	thumbnail256: string;
	thumbnail200: string;
	thumbnail500: string;
	thumbnail1000: string;
	thumbnail2000: string;
	thumbnailExpiration: Date;
	updatedAt: Date;
}

interface ThumbnailRawData {
	thumbnail256: string;
	thumbnail200: string;
	thumbnail500: string;
	thumbnail1000: string;
	thumbnail2000: string;
	thumbnailExpiration: string;
	updatedAt: string;
}

const getThumbnailsFromRecord = async (
	recordId: string,
): Promise<ThumbnailData> => {
	const thumbnailResult = await db.query<ThumbnailRawData>(
		`SELECT
      thumbnail256,
      thumburl200 AS "thumbnail200",
      thumburl500 AS "thumbnail500",
      thumburl1000 AS "thumbnail1000",
      thumburl2000 AS "thumbnail2000",
      thumbdt AS "thumbnailExpiration",
      updateddt AS "updatedAt"
    FROM
      record
    WHERE
      recordId = :recordId
    `,
		{
			recordId,
		},
	);

	if (thumbnailResult.rows[0] === undefined) {
		expect(false).toBe(true);
		return {
			thumbnail256: "",
			thumbnail200: "",
			thumbnail500: "",
			thumbnail1000: "",
			thumbnail2000: "",
			thumbnailExpiration: new Date(),
			updatedAt: new Date(),
		};
	}

	return {
		thumbnail256: thumbnailResult.rows[0].thumbnail256,
		thumbnail200: thumbnailResult.rows[0].thumbnail200,
		thumbnail500: thumbnailResult.rows[0].thumbnail500,
		thumbnail1000: thumbnailResult.rows[0].thumbnail1000,
		thumbnail2000: thumbnailResult.rows[0].thumbnail2000,
		thumbnailExpiration: new Date(thumbnailResult.rows[0].thumbnailExpiration),
		updatedAt: new Date(thumbnailResult.rows[0].updatedAt),
	};
};

const getThumbnailsFromFolder = async (
	folderId: string,
): Promise<ThumbnailData> => {
	const thumbnailResult = await db.query<ThumbnailRawData>(
		`SELECT
      thumbnail256,
      thumburl200 AS "thumbnail200",
      thumburl500 AS "thumbnail500",
      thumburl1000 AS "thumbnail1000",
      thumburl2000 AS "thumbnail2000",
      thumbdt AS "thumbnailExpiration",
      updateddt AS "updatedAt"
    FROM
      folder
    WHERE
      folderId = :folderId
    `,
		{
			folderId,
		},
	);

	if (thumbnailResult.rows[0] === undefined) {
		expect(false).toBe(true);
		return {
			thumbnail256: "",
			thumbnail200: "",
			thumbnail500: "",
			thumbnail1000: "",
			thumbnail2000: "",
			thumbnailExpiration: new Date(),
			updatedAt: new Date(),
		};
	}

	return {
		thumbnail256: thumbnailResult.rows[0].thumbnail256,
		thumbnail200: thumbnailResult.rows[0].thumbnail200,
		thumbnail500: thumbnailResult.rows[0].thumbnail500,
		thumbnail1000: thumbnailResult.rows[0].thumbnail1000,
		thumbnail2000: thumbnailResult.rows[0].thumbnail2000,
		thumbnailExpiration: new Date(thumbnailResult.rows[0].thumbnailExpiration),
		updatedAt: new Date(thumbnailResult.rows[0].updatedAt),
	};
};

const loadFixtures = async (): Promise<void> => {
	await db.sql("fixtures.create_test_accounts");
	await db.sql("fixtures.create_test_archives");
	await db.sql("fixtures.create_test_records");
	await db.sql("fixtures.create_test_folders");
};

const clearDatabase = async (): Promise<void> => {
	await db.query("TRUNCATE account, archive, folder, record CASCADE");
};

describe("refreshThumbnails", () => {
	const testNewThumbnail256 =
		"https://testcdn.permanent.org/access_copies/a755/62ca/8bd5/40f0/9960/d05b/a5ea/8bfa/7028987_upload-b35bfcf6-9c51-47f9-a502-555b601dbcf0/thumbnails/c6561367-6bb4-4454-ad32-0bdb68df80fe.jpg?Expires=2757200649&Policy=new-test-policy&Signature=new-test-signature&Key-Pair-Id=test-key-pair";

	beforeEach(async () => {
		(getSignedUrl as jest.Mock).mockReturnValue(testNewThumbnail256);
		await loadFixtures();
	});

	afterEach(async () => {
		jest.restoreAllMocks();
		jest.clearAllMocks();
		await clearDatabase();
	});

	test("should update a record's thumbnail URLs if thumbDT is less than a month away", async () => {
		const testRecordId = "1";

		const initialThumbnails = await getThumbnailsFromRecord(testRecordId);
		await refreshThumbnails();
		const postRefreshThumbnails = await getThumbnailsFromRecord(testRecordId);

		expect(initialThumbnails.thumbnail256).not.toEqual(
			postRefreshThumbnails.thumbnail256,
		);
		expect(initialThumbnails.thumbnail200).not.toEqual(
			postRefreshThumbnails.thumbnail200,
		);
		expect(initialThumbnails.thumbnail500).not.toEqual(
			postRefreshThumbnails.thumbnail500,
		);
		expect(initialThumbnails.thumbnail1000).not.toEqual(
			postRefreshThumbnails.thumbnail1000,
		);
		expect(initialThumbnails.thumbnail2000).not.toEqual(
			postRefreshThumbnails.thumbnail2000,
		);

		expect(getSignedUrl).toHaveBeenCalledWith(
			"access_copies/a755/62ca/8bd5/40f0/9960/d05b/a5ea/8bfa/7028987_upload-b35bfcf6-9c51-47f9-a502-555b601dbcf0/thumbnails/c6561367-6bb4-4454-ad32-0bdb68df80fe.jpg",
			expect.anything(),
		);
		expect(getSignedUrl).toHaveBeenCalledWith(
			"0001-0001.thumb.w200",
			expect.anything(),
		);
		expect(getSignedUrl).toHaveBeenCalledWith(
			"0001-0001.thumb.w500",
			expect.anything(),
		);
		expect(getSignedUrl).toHaveBeenCalledWith(
			"0001-0001.thumb.w1000",
			expect.anything(),
		);
		expect(getSignedUrl).toHaveBeenCalledWith(
			"0001-0001.thumb.w2000",
			expect.anything(),
		);
	});

	test("should update a folder's thumbnail URLs if thumbDT is less than a month away", async () => {
		const testFolderId = "1";

		const initialThumbnails = await getThumbnailsFromFolder(testFolderId);
		await refreshThumbnails();
		const postRefreshThumbnails = await getThumbnailsFromFolder(testFolderId);

		expect(initialThumbnails.thumbnail256).not.toEqual(
			postRefreshThumbnails.thumbnail256,
		);
		expect(initialThumbnails.thumbnail200).not.toEqual(
			postRefreshThumbnails.thumbnail200,
		);
		expect(initialThumbnails.thumbnail500).not.toEqual(
			postRefreshThumbnails.thumbnail500,
		);
		expect(initialThumbnails.thumbnail1000).not.toEqual(
			postRefreshThumbnails.thumbnail1000,
		);
		expect(initialThumbnails.thumbnail2000).not.toEqual(
			postRefreshThumbnails.thumbnail2000,
		);

		expect(getSignedUrl).toHaveBeenCalledWith(
			"access_copies/a755/62ca/8bd5/40f0/9960/d05b/a5ea/8bfa/7028987_upload-b35bfcf6-9c51-47f9-a502-555b601dbcf0/thumbnails/c6561367-6bb4-4454-ad32-0bdb68df80fe.jpg",
			expect.anything(),
		);
		expect(getSignedUrl).toHaveBeenCalledWith(
			"0001-0001.thumb.w200",
			expect.anything(),
		);
		expect(getSignedUrl).toHaveBeenCalledWith(
			"0001-0001.thumb.w500",
			expect.anything(),
		);
		expect(getSignedUrl).toHaveBeenCalledWith(
			"0001-0001.thumb.w1000",
			expect.anything(),
		);
		expect(getSignedUrl).toHaveBeenCalledWith(
			"0001-0001.thumb.w2000",
			expect.anything(),
		);
	});

	test("should update a record's thumbDT and updatedDT if thumbDT is less than a month away", async () => {
		const testRecordId = "1";

		await refreshThumbnails();
		const postRefreshThumbnails = await getThumbnailsFromRecord(testRecordId);

		const oneYearFromNow = new Date();
		oneYearFromNow.setUTCFullYear(oneYearFromNow.getUTCFullYear() + 1);
		expect(postRefreshThumbnails.thumbnailExpiration.getUTCFullYear()).toEqual(
			oneYearFromNow.getUTCFullYear(),
		);
		expect(postRefreshThumbnails.thumbnailExpiration.getUTCMonth()).toEqual(
			oneYearFromNow.getUTCMonth(),
		);
		expect(postRefreshThumbnails.thumbnailExpiration.getUTCDate()).toEqual(
			oneYearFromNow.getUTCDate(),
		);

		const now = new Date();
		expect(postRefreshThumbnails.updatedAt.getUTCFullYear()).toEqual(
			now.getUTCFullYear(),
		);
		expect(postRefreshThumbnails.updatedAt.getUTCMonth()).toEqual(
			now.getUTCMonth(),
		);
		expect(postRefreshThumbnails.updatedAt.getUTCDate()).toEqual(
			now.getUTCDate(),
		);
	});

	test("should update a folder's thumbDT and updatedDT if thumbDT is less than a month away", async () => {
		const testFolderId = "1";

		await refreshThumbnails();
		const postRefreshThumbnails = await getThumbnailsFromFolder(testFolderId);

		const oneYearFromNow = new Date();
		oneYearFromNow.setUTCFullYear(oneYearFromNow.getUTCFullYear() + 1);
		expect(postRefreshThumbnails.thumbnailExpiration.getUTCFullYear()).toEqual(
			oneYearFromNow.getUTCFullYear(),
		);
		expect(postRefreshThumbnails.thumbnailExpiration.getUTCMonth()).toEqual(
			oneYearFromNow.getUTCMonth(),
		);
		expect(postRefreshThumbnails.thumbnailExpiration.getUTCDate()).toEqual(
			oneYearFromNow.getUTCDate(),
		);

		const now = new Date();
		expect(postRefreshThumbnails.updatedAt.getUTCFullYear()).toEqual(
			now.getUTCFullYear(),
		);
		expect(postRefreshThumbnails.updatedAt.getUTCMonth()).toEqual(
			now.getUTCMonth(),
		);
		expect(postRefreshThumbnails.updatedAt.getUTCDate()).toEqual(
			now.getUTCDate(),
		);
	});

	test("should not update a record if thumbDT is more than a month away", async () => {
		const testRecordId = "2";
		const initialThumbnails = await getThumbnailsFromRecord(testRecordId);

		await refreshThumbnails();
		const postRefreshThumbnails = await getThumbnailsFromRecord(testRecordId);

		expect(initialThumbnails.thumbnail256).toEqual(
			postRefreshThumbnails.thumbnail256,
		);
		expect(initialThumbnails.thumbnailExpiration).toEqual(
			postRefreshThumbnails.thumbnailExpiration,
		);
		expect(initialThumbnails.updatedAt).toEqual(
			postRefreshThumbnails.updatedAt,
		);
	});

	test("should not update record thumbnails which are currently null", async () => {
		const testRecordId = "3";

		await refreshThumbnails();
		const postRefreshThumbnails = await getThumbnailsFromRecord(testRecordId);

		expect(postRefreshThumbnails.thumbnail200).toBeNull();
		expect(postRefreshThumbnails.thumbnail500).toBeNull();
		expect(postRefreshThumbnails.thumbnail1000).toBeNull();
		expect(postRefreshThumbnails.thumbnail2000).toBeNull();
		expect(postRefreshThumbnails.thumbnail256).toBeNull();
	});

	test("should not update folder thumbnails which are currently null", async () => {
		const testFolderId = "3";

		await refreshThumbnails();
		const postRefreshThumbnails = await getThumbnailsFromFolder(testFolderId);

		expect(postRefreshThumbnails.thumbnail200).toBeNull();
		expect(postRefreshThumbnails.thumbnail500).toBeNull();
		expect(postRefreshThumbnails.thumbnail1000).toBeNull();
		expect(postRefreshThumbnails.thumbnail2000).toBeNull();
		expect(postRefreshThumbnails.thumbnail256).toBeNull();
	});

	test("should not update a folder if thumbDT is more than a month away", async () => {
		const testFolderId = "2";
		const initialThumbnails = await getThumbnailsFromFolder(testFolderId);

		await refreshThumbnails();
		const postRefreshThumbnails = await getThumbnailsFromFolder(testFolderId);

		expect(initialThumbnails.thumbnail256).toEqual(
			postRefreshThumbnails.thumbnail256,
		);
		expect(initialThumbnails.thumbnailExpiration).toEqual(
			postRefreshThumbnails.thumbnailExpiration,
		);
		expect(initialThumbnails.updatedAt).toEqual(
			postRefreshThumbnails.updatedAt,
		);
	});

	test("should log and rethrow an error if database call to find items fails", async () => {
		expect.assertions(2);
		const errorMessage = "out of cheese - redo from start";
		jest.spyOn(db, "sql").mockRejectedValue(errorMessage);
		await refreshThumbnails().catch((err) => {
			expect(err).toEqual(errorMessage);
		});
		expect(logger.error).toHaveBeenCalled();
	});

	test("should log error if an individual update fails", async () => {
		const errorMessage = "out of cheese - redo from start";
		jest
			.spyOn(db, "sql")
			.mockImplementationOnce((async () => ({
				rows: [
					{
						recordId: "1",
						archiveNumber: "0001-0001",
						thumbnail256CloudPath: "test-cloud-path",
					},
					{
						recordId: "2",
						archiveNumber: "0001-0002",
						thumbnail256CloudPath: "test-cloud-path",
					},
				],
			})) as unknown as typeof db.sql)
			.mockRejectedValueOnce(errorMessage);

		await refreshThumbnails();

		expect(logger.error).toHaveBeenCalled();
	});
});
