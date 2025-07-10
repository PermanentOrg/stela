import { logger } from "@stela/logger";
import { constructSignedCdnUrl } from "@stela/s3-utils";
import { refreshFileUrls } from "./service";
import { db } from "./database";

jest.mock("@stela/logger");
jest.mock("@stela/s3-utils");
jest.mock("./database");

interface FileData {
	accessUrl: string;
	downloadUrl: string;
	urlExpiration: Date;
	updatedAt: Date;
}

interface FileRawData {
	accessUrl: string;
	downloadUrl: string;
	urlExpiration: string;
	updatedAt: string;
}

const getUrlsFromFile = async (fileId: string): Promise<FileData> => {
	const fileResult = await db.query<FileRawData>(
		`SELECT
			fileurl AS "accessUrl",
			downloadurl AS "downloadUrl",
			urldt AS "urlExpiration",
			updateddt AS "updatedAt"
		FROM
			file
		WHERE
			fileid = :fileId
		`,
		{
			fileId,
		},
	);

	if (fileResult.rows[0] === undefined) {
		expect(false).toBe(true);
		return {
			accessUrl: "",
			downloadUrl: "",
			urlExpiration: new Date(),
			updatedAt: new Date(),
		};
	}

	return {
		accessUrl: fileResult.rows[0].accessUrl,
		downloadUrl: fileResult.rows[0].downloadUrl,
		urlExpiration: new Date(fileResult.rows[0].urlExpiration),
		updatedAt: new Date(fileResult.rows[0].updatedAt),
	};
};

const loadFixtures = async (): Promise<void> => {
	await db.sql("fixtures.create_test_accounts");
	await db.sql("fixtures.create_test_archives");
	await db.sql("fixtures.create_test_records");
	await db.sql("fixtures.create_test_files");
	await db.sql("fixtures.create_test_record_files");
};

const clearDatabase = async (): Promise<void> => {
	await db.query(
		"TRUNCATE account, archive, record, file, record_file CASCADE",
	);
};

describe("refreshThumbnails", () => {
	const testFileUrl =
		"https://testcdn.permanent.org/originals/1/1?Expires=2757200650&Policy=new-test-policy&Signature=new-test-signature&Key-Pair-Id=test-key-pair";
	const testDownloadUrl =
		"https://testcdn.permanent.org/originals/1/1?Expires=2757200650&Policy=new-test-policy&Signature=new-test-signature&Key-Pair-Id=test-key-pair&response-content-disposition=attachment; filename=public_file.png";

	beforeEach(async () => {
		jest
			.mocked(constructSignedCdnUrl)
			.mockImplementation((_: string, fileName?: string) => {
				if (fileName === null) {
					return testDownloadUrl;
				}
				return testFileUrl;
			});
		await loadFixtures();
	});

	afterEach(async () => {
		jest.restoreAllMocks();
		jest.clearAllMocks();
		await clearDatabase();
	});

	test("should update a file's URLs if urlDT is less than a month away", async () => {
		const testFileId = "1";

		const initialUrls = await getUrlsFromFile(testFileId);
		await refreshFileUrls();
		const postRefreshUrls = await getUrlsFromFile(testFileId);

		expect(constructSignedCdnUrl).toHaveBeenCalledWith(
			"originals/1/1",
			expect.anything(),
		);
		expect(constructSignedCdnUrl).toHaveBeenCalledWith(
			"originals/1/1",
			"public_file.png",
		);

		expect(initialUrls.accessUrl).not.toEqual(postRefreshUrls.accessUrl);
		expect(initialUrls.downloadUrl).not.toEqual(postRefreshUrls.downloadUrl);

		const oneYearFromNow = new Date();
		oneYearFromNow.setUTCFullYear(oneYearFromNow.getUTCFullYear() + 1);
		expect(postRefreshUrls.urlExpiration.getUTCFullYear()).toEqual(
			oneYearFromNow.getUTCFullYear(),
		);
		expect(postRefreshUrls.urlExpiration.getUTCMonth()).toEqual(
			oneYearFromNow.getUTCMonth(),
		);
		expect(postRefreshUrls.urlExpiration.getUTCDate()).toEqual(
			oneYearFromNow.getUTCDate(),
		);

		const now = new Date();
		expect(postRefreshUrls.updatedAt.getUTCFullYear()).toEqual(
			now.getUTCFullYear(),
		);
		expect(postRefreshUrls.updatedAt.getUTCMonth()).toEqual(now.getUTCMonth());
		expect(postRefreshUrls.updatedAt.getUTCDate()).toEqual(now.getUTCDate());
	});

	test("should generate the correct downloadUrl for a non-original file", async () => {
		await refreshFileUrls();

		expect(constructSignedCdnUrl).toHaveBeenCalledWith(
			"originals/1/1",
			"public_file.jpg",
		);
	});

	test("should not update a file if urlDT is more than a month away", async () => {
		const testFileId = "2";

		const initialUrls = await getUrlsFromFile(testFileId);
		await refreshFileUrls();
		const postRefreshUrls = await getUrlsFromFile(testFileId);

		expect(initialUrls.accessUrl).toEqual(postRefreshUrls.accessUrl);
		expect(initialUrls.downloadUrl).toEqual(postRefreshUrls.downloadUrl);
		expect(initialUrls.urlExpiration).toEqual(postRefreshUrls.urlExpiration);
		expect(initialUrls.updatedAt).toEqual(postRefreshUrls.updatedAt);
	});

	test("should not update a file where urlDT is currently null", async () => {
		const testFileId = "3";

		const initialUrls = await getUrlsFromFile(testFileId);
		await refreshFileUrls();
		const postRefreshUrls = await getUrlsFromFile(testFileId);

		expect(initialUrls.accessUrl).toEqual(postRefreshUrls.accessUrl);
		expect(initialUrls.downloadUrl).toEqual(postRefreshUrls.downloadUrl);
		expect(initialUrls.urlExpiration).toEqual(postRefreshUrls.urlExpiration);
		expect(initialUrls.updatedAt).toEqual(postRefreshUrls.updatedAt);
	});

	test("should not update a deleted file", async () => {
		const testFileId = "5";

		const initialUrls = await getUrlsFromFile(testFileId);
		await refreshFileUrls();
		const postRefreshUrls = await getUrlsFromFile(testFileId);

		expect(initialUrls.accessUrl).toEqual(postRefreshUrls.accessUrl);
		expect(initialUrls.downloadUrl).toEqual(postRefreshUrls.downloadUrl);
		expect(initialUrls.urlExpiration).toEqual(postRefreshUrls.urlExpiration);
		expect(initialUrls.updatedAt).toEqual(postRefreshUrls.updatedAt);
	});

	test("should log and rethrow an error if database call to find items fails", async () => {
		expect.assertions(2);
		const errorMessage = "out of cheese - redo from start";
		jest.spyOn(db, "sql").mockRejectedValue(errorMessage);
		await refreshFileUrls().catch((err: unknown) => {
			expect(err).toEqual(errorMessage);
		});
		expect(logger.error).toHaveBeenCalled();
	});

	test("should log error if an individual update fails", async () => {
		const errorMessage = "out of cheese - redo from start";
		jest
			.spyOn(db, "sql")
			.mockImplementationOnce(
				jest.fn().mockResolvedValue({
					rows: [
						{
							id: "1",
							cloudPath: "originals/1/1",
							uploadName: "public_file.jpg",
							type: "type.file.image.jpg",
							format: "file.format.original",
						},
					],
				}),
			)
			.mockRejectedValueOnce(errorMessage);

		await refreshFileUrls();

		expect(logger.error).toHaveBeenCalled();
	});
});
