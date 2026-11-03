import request from "supertest";
import {
	afterAll,
	afterEach,
	beforeEach,
	describe,
	expect,
	test,
	vi,
} from "vitest";
import type { NextFunction } from "express";
import createError from "http-errors";
import { logger } from "@stela/logger";
import { app } from "../app.js";
import { db } from "../database.js";
import { lowPriorityTopicArn, publisherClient } from "@stela/publisher-utils";
import { verifyAdminAuthentication } from "../middleware/index.js";
import { mockVerifyAdminAuthentication } from "../../test/middleware_mocks.js";
import { runFixtures } from "../../test/run_fixtures.js";
import { mockSqlCall } from "../../test/mock_sql.js";
import { s3Service } from "../s3.js";

vi.mock("../database");
vi.mock("@stela/logger");
vi.mock("../middleware");
vi.mock("@stela/publisher-utils");
vi.mock("@stela/s3-utils", () => ({
	constructSignedCdnUrl: (key: string, fileName?: string): string =>
		fileName === undefined
			? `https://cdn.permanent.org/${key}?signed`
			: `https://cdn.permanent.org/${key}?signed&filename=${fileName}`,
}));

describe("recalculateFolderThumbnails", () => {
	const loadFixtures = async (): Promise<void> => {
		await db.sql("admin.fixtures.create_test_folders");
	};

	const clearDatabase = async (): Promise<void> => {
		await db.query("TRUNCATE folder CASCADE");
	};

	const agent = request(app);
	beforeEach(async () => {
		mockVerifyAdminAuthentication(
			"test@permanent.org",
			"5c3473b6-cf2e-4c55-a80e-8db51d1bc5fd",
		);
		vi.clearAllMocks();
		await clearDatabase();
		await loadFixtures();
	});

	afterAll(async () => {
		await clearDatabase();
	});

	test("should send messages for folders created before the cutoff", async () => {
		vi.spyOn(publisherClient, "batchPublishMessages").mockResolvedValueOnce({
			failedMessages: [],
			messagesSent: 6,
		});
		const result = await agent
			.post("/api/v2/admin/folder/recalculate_thumbnails")
			.send({
				beginTimestamp: new Date(new Date().setDate(new Date().getDate() - 1)),
				endTimestamp: new Date(),
			})
			.expect(200);
		const {
			mock: {
				calls: [callsToBatchPublish],
			},
		} = vi.mocked(publisherClient.batchPublishMessages);
		expect(callsToBatchPublish).toBeDefined();
		if (callsToBatchPublish !== undefined) {
			expect(callsToBatchPublish[1].length).toBe(6);
		}
		expect(result.body).toEqual({ failedFolders: [], messagesSent: 6 });
	});

	test("should respond with 500 error if messages fail to send", async () => {
		vi.spyOn(publisherClient, "batchPublishMessages").mockResolvedValueOnce({
			failedMessages: ["1", "2"],
			messagesSent: 2,
		});
		const result = await agent
			.post("/api/v2/admin/folder/recalculate_thumbnails")
			.send({
				beginTimestamp: new Date(new Date().setDate(new Date().getDate() - 1)),
				endTimestamp: new Date(),
			})
			.expect(500);
		expect(result.body).toEqual({ failedFolders: ["1", "2"], messagesSent: 2 });
	});

	test("should respond with internal server error if database call fails", async () => {
		const testError = new Error("out of cheese - redo from start");
		vi.spyOn(db, "sql").mockRejectedValueOnce(testError);
		await agent
			.post("/api/v2/admin/folder/recalculate_thumbnails")
			.send({
				beginTimestamp: new Date(new Date().setDate(new Date().getDate() - 1)),
				endTimestamp: new Date(),
			})
			.expect(500);
		expect(logger.error).toHaveBeenCalledWith(testError);
	});

	test("should respond with internal server error if message publishing fails", async () => {
		const testError = new Error("out of cheese - redo from start");
		vi.spyOn(publisherClient, "batchPublishMessages").mockRejectedValueOnce(
			testError,
		);
		await agent
			.post("/api/v2/admin/folder/recalculate_thumbnails")
			.send({
				beginTimestamp: new Date(new Date().setDate(new Date().getDate() - 1)),
				endTimestamp: new Date(),
			})
			.expect(500);
		expect(logger.error).toHaveBeenCalledWith(testError);
	});

	test("should respond with bad request error if payload is invalid", async () => {
		await agent
			.post("/api/v2/admin/folder/recalculate_thumbnails")
			.send({})
			.expect(400);
	});
});

describe("set_null_subjects", () => {
	const agent = request(app);

	const loadFixtures = async (): Promise<void> => {
		await db.sql("admin.fixtures.create_test_accounts");
	};

	const clearDatabase = async (): Promise<void> => {
		await db.query("TRUNCATE account CASCADE");
	};

	beforeEach(async () => {
		mockVerifyAdminAuthentication(
			"test@permanent.org",
			"5c3473b6-cf2e-4c55-a80e-8db51d1bc5fd",
		);
		vi.clearAllMocks();
		await clearDatabase();
		await loadFixtures();
	});

	afterAll(async () => {
		await clearDatabase();
	});

	test("should respond with 200 for a successful request", async () => {
		await agent
			.post("/api/v2/admin/account/set_null_subjects")
			.send({ accounts: [] })
			.expect(200);
	});

	test("should respond with 401 if not authenticated", async () => {
		vi.mocked(verifyAdminAuthentication).mockImplementation(
			async (_, __, next: NextFunction) => {
				next(new createError.Unauthorized("Invalid token"));
			},
		);
		await agent
			.post("/api/v2/admin/account/set_null_subjects")
			.send({})
			.expect(401);
	});

	test("should respond with 400 if no accounts are passed in", async () => {
		await agent
			.post("/api/v2/admin/account/set_null_subjects")
			.send({})
			.expect(400);
	});

	test("should respond with 400 if accounts not an array", async () => {
		await agent
			.post("/api/v2/admin/account/set_null_subjects")
			.send({ accounts: "not an array" })
			.expect(400);
	});

	test("should respond with 400 if accounts missing emails", async () => {
		await agent
			.post("/api/v2/admin/account/set_null_subjects")
			.send({
				accounts: [{ subject: "5c3473b6-cf2e-4c55-a80e-8db51d1bc5fd" }, {}],
			})
			.expect(400);
	});

	test("should respond with 400 if accounts have malformed emails", async () => {
		await agent
			.post("/api/v2/admin/account/set_null_subjects")
			.send({
				accounts: [
					{
						email: "test@permanent.org",
						subject: "5c3473b6-cf2e-4c55-a80e-8db51d1bc5fd",
					},
					{
						email: "not_an_email",
						subject: "5c3473b6-cf2e-4c55-a80e-8db51d1bc5fd",
					},
				],
			})
			.expect(400);
	});

	test("should respond with 400 if accounts are missing subjects", async () => {
		await agent
			.post("/api/v2/admin/account/set_null_subjects")
			.send({
				accounts: [{ email: "test@permanent.org" }],
			})
			.expect(400);
	});

	test("should respond with 400 if accounts have malformed subjects", async () => {
		await agent
			.post("/api/v2/admin/account/set_null_subjects")
			.send({
				accounts: [{ email: "test@permanent.org", subject: "not_a_uuid" }],
			})
			.expect(400);
	});

	test("should update subjects for accounts with null subjects", async () => {
		const testEmail = "test@permanent.org";
		await agent
			.post("/api/v2/admin/account/set_null_subjects")
			.send({
				accounts: [
					{ email: testEmail, subject: "5c3473b6-cf2e-4c55-a80e-8db51d1bc5fd" },
				],
			})
			.expect(200);

		const result = await db.query<{ subject: string }>(
			"SELECT subject FROM account WHERE primaryEmail = :email",
			{ email: testEmail },
		);
		expect(result.rows[0]).not.toBeNull();
		expect(result.rows[0]?.subject).toEqual(
			"5c3473b6-cf2e-4c55-a80e-8db51d1bc5fd",
		);
	});

	test("should not update subjects for accounts with subjects already", async () => {
		const testEmail = "test+1@permanent.org";
		await agent
			.post("/api/v2/admin/account/set_null_subjects")
			.send({
				accounts: [
					{ email: testEmail, subject: "5c3473b6-cf2e-4c55-a80e-8db51d1bc5fd" },
				],
			})
			.expect(200);

		const result = await db.query<{ subject: string }>(
			"SELECT subject FROM account WHERE primaryEmail = :email",
			{ email: testEmail },
		);
		expect(result.rows[0]).not.toBeNull();
		expect(result.rows[0]?.subject).not.toEqual(
			"5c3473b6-cf2e-4c55-a80e-8db51d1bc5fd",
		);
	});

	test("should not update subjects for accounts that aren't open", async () => {
		const testEmail = "test+3@permanent.org";
		await agent
			.post("/api/v2/admin/account/set_null_subjects")
			.send({
				accounts: [
					{ email: testEmail, subject: "5c3473b6-cf2e-4c55-a80e-8db51d1bc5fd" },
				],
			})
			.expect(200);

		const result = await db.query<{ subject: string }>(
			"SELECT subject FROM account WHERE primaryEmail = :email",
			{ email: testEmail },
		);
		expect(result.rows[0]).not.toBeNull();
		expect(result.rows[0]?.subject).not.toEqual(
			"5c3473b6-cf2e-4c55-a80e-8db51d1bc5fd",
		);
	});

	test("should return the ids of updated accounts", async () => {
		const testEmailOne = "test@permanent.org";
		const testEmailTwo = "test+2@permanent.org";
		const testEmailThree = "test+3@permanent.org";
		await agent
			.post("/api/v2/admin/account/set_null_subjects")
			.send({
				accounts: [
					{
						email: testEmailOne,
						subject: "5c3473b6-cf2e-4c55-a80e-8db51d1bc5fd",
					},
					{
						email: testEmailTwo,
						subject: "a98fc110-eddc-45fd-893b-c5fd5cc2063f",
					},
					{
						email: testEmailThree,
						subject: "d3b7267c-ebdd-46ef-8396-af196b2a5af4",
					},
				],
			})
			.expect(200, { updatedAccounts: ["2", "4"], emailsWithErrors: [] });
	});

	test("should look up emails case-insensitively", async () => {
		const testEmail = "test+4@permanent.org";
		await agent
			.post("/api/v2/admin/account/set_null_subjects")
			.send({
				accounts: [
					{
						email: testEmail,
						subject: "5c3473b6-cf2e-4c55-a80e-8db51d1bc5fd",
					},
				],
			})
			.expect(200, { updatedAccounts: ["6"], emailsWithErrors: [] });
	});

	test("should call logger.error if database call fails", async () => {
		const testError = new Error("out of cheese - redo from start");
		vi.spyOn(db, "sql").mockRejectedValueOnce(testError);

		const testEmailOne = "test@permanent.org";
		await agent
			.post("/api/v2/admin/account/set_null_subjects")
			.send({
				accounts: [
					{
						email: testEmailOne,
						subject: "5c3473b6-cf2e-4c55-a80e-8db51d1bc5fd",
					},
				],
			})
			.expect(200);
		expect(logger.error).toHaveBeenCalledWith(testError);
	});

	test("should return emails for which the update failed", async () => {
		const testError = new Error("out of cheese - redo from start");
		vi.spyOn(db, "sql").mockRejectedValueOnce(testError);

		const testEmailOne = "test@permanent.org";
		const testEmailTwo = "test+2@permanent.org";
		await agent
			.post("/api/v2/admin/account/set_null_subjects")
			.send({
				accounts: [
					{
						email: testEmailOne,
						subject: "5c3473b6-cf2e-4c55-a80e-8db51d1bc5fd",
					},
					{
						email: testEmailTwo,
						subject: "a98fc110-eddc-45fd-893b-c5fd5cc2063f",
					},
				],
			})
			.expect(200, {
				emailsWithErrors: [testEmailOne],
				updatedAccounts: ["4"],
			});
	});
});

describe("/record/:recordId/recalculate_thumbnail", () => {
	const agent = request(app);

	const loadFixtures = async (): Promise<void> => {
		await runFixtures(db, [
			"admin.fixtures.create_test_accounts",
			"admin.fixtures.create_test_archives",
			"admin.fixtures.create_test_records",
			"admin.fixtures.create_test_folders",
			"admin.fixtures.create_test_folder_links",
		]);
	};

	const clearDatabase = async (): Promise<void> => {
		await db.query(
			"TRUNCATE account, archive, record, folder, folder_link CASCADE",
		);
	};

	beforeEach(async () => {
		mockVerifyAdminAuthentication(
			"test@permanent.org",
			"5c3473b6-cf2e-4c55-a80e-8db51d1bc5fd",
		);
		vi.clearAllMocks();
		await clearDatabase();
		await loadFixtures();
	});

	afterAll(async () => {
		await clearDatabase();
	});

	test("should response with 401 if not authenticated as an admin", async () => {
		vi.mocked(verifyAdminAuthentication).mockImplementation(
			async (_, __, next: NextFunction) => {
				next(new createError.Unauthorized("Invalid token"));
			},
		);
		await agent
			.post("/api/v2/admin/record/1/recalculate_thumbnail")
			.expect(401);
	});

	test("should publish a message with correct parameters", async () => {
		vi.mocked(publisherClient.batchPublishMessages).mockResolvedValueOnce({
			failedMessages: [],
			messagesSent: 1,
		});
		await agent
			.post("/api/v2/admin/record/1/recalculate_thumbnail")
			.expect(200);

		expect(publisherClient.batchPublishMessages).toHaveBeenCalled();
		const {
			mock: {
				calls: [firstCallToBatchPublish],
			},
		} = vi.mocked(publisherClient.batchPublishMessages);
		expect(firstCallToBatchPublish).toBeDefined();
		if (firstCallToBatchPublish !== undefined) {
			const [, [firstMessage]] = firstCallToBatchPublish;
			expect(firstMessage).toBeDefined();
			if (firstMessage !== undefined) {
				const publishBody = JSON.parse(firstMessage.body) as unknown;
				if (
					typeof publishBody === "object" &&
					publishBody !== null &&
					"parameters" in publishBody &&
					Array.isArray(publishBody.parameters)
				) {
					expect(publishBody.parameters.length).toBe(6);
					expect(publishBody.parameters[1]).toBe("1");
					expect(publishBody.parameters[2]).toBe("1");
					expect(publishBody.parameters[3]).toBe("1");
				} else {
					expect(false).toBe(true);
				}
			}
		}
	});

	test("should respond with 404 if the record doesn't exist", async () => {
		await agent
			.post("/api/v2/admin/record/1000/recalculate_thumbnail")
			.expect(404);
	});

	test("should respond with 500 if the message fails to send", async () => {
		vi.spyOn(publisherClient, "batchPublishMessages").mockResolvedValueOnce({
			failedMessages: ["1"],
			messagesSent: 0,
		});
		await agent
			.post("/api/v2/admin/record/1/recalculate_thumbnail")
			.expect(500);
	});

	test("should respond with 500  and log the error if the database call fails", async () => {
		const testError = new Error("out of cheese - redo from start");
		vi.spyOn(db, "sql").mockRejectedValueOnce(testError);

		await agent
			.post("/api/v2/admin/record/1/recalculate_thumbnail")
			.expect(500);
		expect(logger.error).toHaveBeenCalledWith(testError);
	});
});

describe("/folder/delete-orphaned-folders", () => {
	const agent = request(app);

	const loadFixtures = async (): Promise<void> => {
		await runFixtures(db, [
			"admin.fixtures.create_test_accounts",
			"admin.fixtures.create_test_archives",
			"admin.fixtures.create_test_folders",
			"admin.fixtures.create_test_records",
			"admin.fixtures.create_test_folder_links",
		]);
	};

	beforeEach(async () => {
		mockVerifyAdminAuthentication(
			"test@permanent.org",
			"5c3473b6-cf2e-4c55-a80e-8db51d1bc5fd",
		);
		vi.mocked(publisherClient.batchPublishMessages).mockResolvedValue({
			failedMessages: [],
			messagesSent: 2,
		});

		await loadFixtures();
	});

	afterEach(async () => {
		await db.query(
			"TRUNCATE account, archive, folder, record, folder_link CASCADE",
		);
		vi.clearAllMocks();
	});

	test("should respond with 401 if not authenticated as an admin", async () => {
		vi.mocked(verifyAdminAuthentication).mockImplementation(
			async (_, __, next: NextFunction) => {
				next(new createError.Unauthorized("Invalid token"));
			},
		);
		await agent
			.post("/api/v2/admin/folder/delete-orphaned-folders")
			.expect(401);
	});

	test("should call batchPublishMessages with correct parameters", async () => {
		const response = await agent
			.post("/api/v2/admin/folder/delete-orphaned-folders")
			.expect(200);

		expect(publisherClient.batchPublishMessages).toHaveBeenCalledWith(
			lowPriorityTopicArn,
			[
				{
					id: "12",
					body: JSON.stringify({
						task: "task.folder.delete.all",
						parameters: ["Folder_Delete_ALL", "1234-1234", "1", "16"],
					}),
				},
				{
					id: "13",
					body: JSON.stringify({
						task: "task.folder.delete.all",
						parameters: ["Folder_Delete_ALL", "1234-1235", "1", "17"],
					}),
				},
			],
		);

		expect(response.body).toEqual({ messagesSent: 2, folderIdsWithErrors: [] });
	});

	test("should respond with a 500 error if publishing fails", async () => {
		const testError = new Error("Out of cheese - redo from start");
		vi.mocked(publisherClient.batchPublishMessages).mockRejectedValue(
			testError,
		);

		await agent
			.post("/api/v2/admin/folder/delete-orphaned-folders")
			.expect(500);
		expect(logger.error).toHaveBeenCalledWith(testError);
	});

	test("should respond with a 500 error if database call fails", async () => {
		const testError = new Error("Out of cheese - redo from start");
		vi.spyOn(db, "sql").mockRejectedValue(testError);

		await agent
			.post("/api/v2/admin/folder/delete-orphaned-folders")
			.expect(500);
		expect(logger.error).toHaveBeenCalledWith(testError);
	});
});

describe("/file/modernize_cloudpaths", () => {
	const agent = request(app);
	const endpoint = "/api/v2/admin/file/modernize_cloudpaths";

	const loadFixtures = async (): Promise<void> => {
		await runFixtures(db, [
			"admin.fixtures.create_test_accounts",
			"admin.fixtures.create_test_archives",
			"admin.fixtures.create_test_records",
			"admin.fixtures.create_test_files",
			"admin.fixtures.create_test_record_files",
		]);
	};

	const clearDatabase = async (): Promise<void> => {
		await db.query(
			"TRUNCATE account, archive, record, file, record_file CASCADE",
		);
	};

	const getFile = async (
		fileId: string,
	): Promise<
		| {
				cloudPath: string | null;
				fileUrl: string | null;
				downloadUrl: string | null;
				urlDt: Date | null;
		  }
		| undefined
	> => {
		const result = await db.query<{
			cloudPath: string | null;
			fileUrl: string | null;
			downloadUrl: string | null;
			urlDt: Date | null;
		}>(
			`SELECT
				cloudpath AS "cloudPath",
				fileurl AS "fileUrl",
				downloadurl AS "downloadUrl",
				urldt AS "urlDt"
			FROM file WHERE fileid = :fileId`,
			{ fileId },
		);
		return result.rows[0];
	};

	beforeEach(async () => {
		mockVerifyAdminAuthentication(
			"test@permanent.org",
			"5c3473b6-cf2e-4c55-a80e-8db51d1bc5fd",
		);
		vi.spyOn(s3Service, "copyObject").mockResolvedValue();
		vi.spyOn(s3Service, "deleteObject").mockResolvedValue();
		await clearDatabase();
		await loadFixtures();
	});

	afterEach(async () => {
		await clearDatabase();
		vi.restoreAllMocks();
		vi.clearAllMocks();
	});

	test("should respond with 401 if not authenticated as an admin", async () => {
		vi.mocked(verifyAdminAuthentication).mockImplementation(
			async (_, __, next: NextFunction) => {
				next(new createError.Unauthorized("Invalid token"));
			},
		);
		await agent
			.post(endpoint)
			.send({ fileIds: ["1"] })
			.expect(401);
	});

	test("should respond with 400 if fileIds is missing", async () => {
		await agent.post(endpoint).send({}).expect(400);
	});

	test("should respond with 400 if fileIds is empty", async () => {
		await agent.post(endpoint).send({ fileIds: [] }).expect(400);
	});

	test("should respond with 400 if a fileId is not numeric", async () => {
		await agent
			.post(endpoint)
			.send({ fileIds: ["abc"] })
			.expect(400);
	});

	test("should respond with 400 if fileIds contains duplicates", async () => {
		await agent
			.post(endpoint)
			.send({ fileIds: ["1", "1"] })
			.expect(400);
	});

	test("should move a legacy original file and update its record", async () => {
		const response = await agent
			.post(endpoint)
			.send({ fileIds: ["1"] })
			.expect(200);

		expect(response.body).toEqual({
			updatedFileIds: ["1"],
			skippedFiles: [],
			fileIdsWithErrors: [],
			fileIdsWithUndeletedOldObjects: [],
		});
		expect(s3Service.copyObject).toHaveBeenCalledWith("1", "originals/1/1");
		expect(s3Service.deleteObject).toHaveBeenCalledWith("1");

		const file = await getFile("1");
		expect(file?.cloudPath).toBe("originals/1/1");
		expect(file?.fileUrl).toBe(
			"https://cdn.permanent.org/originals/1/1?signed",
		);
		expect(file?.downloadUrl).toBe(
			"https://cdn.permanent.org/originals/1/1?signed&filename=Renamed File.jpg",
		);
		expect(file?.urlDt?.getTime()).toBeGreaterThan(Date.now());
	});

	test("should preserve a local developer prefix", async () => {
		await agent
			.post(endpoint)
			.send({ fileIds: ["2"] })
			.expect(200);

		expect(s3Service.copyObject).toHaveBeenCalledWith(
			"_Liam/2",
			"_Liam/originals/2/2",
		);
		expect(s3Service.deleteObject).toHaveBeenCalledWith("_Liam/2");
		const file = await getFile("2");
		expect(file?.cloudPath).toBe("_Liam/originals/2/2");
	});

	test("should sign a download URL without a file name if the file has no record", async () => {
		await agent
			.post(endpoint)
			.send({ fileIds: ["7"] })
			.expect(200);

		const file = await getFile("7");
		expect(file?.downloadUrl).toBe(
			"https://cdn.permanent.org/originals/7/7?signed",
		);
	});

	test("should skip files that can't or don't need to be modernized", async () => {
		const response = await agent
			.post(endpoint)
			.send({ fileIds: ["3", "4", "5", "6", "999"] })
			.expect(200);

		expect(response.body).toEqual({
			updatedFileIds: [],
			skippedFiles: [
				{ fileId: "3", reason: "Cloudpath is not in the legacy format" },
				{ fileId: "4", reason: "File is not an original" },
				{ fileId: "5", reason: "File has no cloudpath" },
				{ fileId: "6", reason: "Cloudpath is not in the legacy format" },
				{ fileId: "999", reason: "File not found" },
			],
			fileIdsWithErrors: [],
			fileIdsWithUndeletedOldObjects: [],
		});
		expect(s3Service.copyObject).not.toHaveBeenCalled();
		expect(s3Service.deleteObject).not.toHaveBeenCalled();
		expect((await getFile("3"))?.cloudPath).toBe("originals/3/3");
		expect((await getFile("4"))?.cloudPath).toBe("4");
		expect((await getFile("6"))?.cloudPath).toBe("unexpected/path");
	});

	test("should roll back the database update if the S3 copy fails", async () => {
		const testError = new Error("S3 is down");
		vi.mocked(s3Service.copyObject).mockRejectedValue(testError);

		const response = await agent
			.post(endpoint)
			.send({ fileIds: ["1"] })
			.expect(500);

		expect(response.body).toEqual({
			updatedFileIds: [],
			skippedFiles: [],
			fileIdsWithErrors: ["1"],
			fileIdsWithUndeletedOldObjects: [],
		});
		expect(logger.error).toHaveBeenCalledWith(testError);
		expect(s3Service.deleteObject).not.toHaveBeenCalled();
		const file = await getFile("1");
		expect(file?.cloudPath).toBe("1");
		expect(file?.fileUrl).toBe("https://cdn.permanent.org/old-file-url");
		expect(file?.downloadUrl).toBe(
			"https://cdn.permanent.org/old-download-url",
		);
	});

	test("should keep processing other files after one fails", async () => {
		vi.mocked(s3Service.copyObject).mockRejectedValueOnce(
			new Error("S3 is down"),
		);

		const response = await agent
			.post(endpoint)
			.send({ fileIds: ["1", "2"] })
			.expect(500);

		expect(response.body).toEqual({
			updatedFileIds: ["2"],
			skippedFiles: [],
			fileIdsWithErrors: ["1"],
			fileIdsWithUndeletedOldObjects: [],
		});
		expect((await getFile("1"))?.cloudPath).toBe("1");
		expect((await getFile("2"))?.cloudPath).toBe("_Liam/originals/2/2");
	});

	test("should keep the database update and report it if deleting the old object fails", async () => {
		const testError = new Error("S3 is down");
		vi.mocked(s3Service.deleteObject).mockRejectedValue(testError);

		const response = await agent
			.post(endpoint)
			.send({ fileIds: ["1"] })
			.expect(500);

		expect(response.body).toEqual({
			updatedFileIds: ["1"],
			skippedFiles: [],
			fileIdsWithErrors: [],
			fileIdsWithUndeletedOldObjects: ["1"],
		});
		expect(logger.error).toHaveBeenCalledWith(testError);
		expect((await getFile("1"))?.cloudPath).toBe("originals/1/1");
	});

	test("should not overwrite or move a file whose cloudpath changes after it is looked up", async () => {
		await db.query(
			"UPDATE file SET cloudpath = 'originals/1/1' WHERE fileid = 1",
		);
		mockSqlCall(
			db,
			"admin.queries.get_original_file",
			{ fileId: "1" },
			{
				resolve: {
					rows: [
						{
							fileId: "1",
							format: "file.format.original",
							cloudPath: "1",
							recordDownloadName: "Renamed File.jpg",
						},
					],
				},
			},
		);

		const response = await agent
			.post(endpoint)
			.send({ fileIds: ["1"] })
			.expect(500);

		expect(response.body).toEqual({
			updatedFileIds: [],
			skippedFiles: [],
			fileIdsWithErrors: ["1"],
			fileIdsWithUndeletedOldObjects: [],
		});
		expect(logger.error).toHaveBeenCalledWith(
			new Error("Cloudpath of file 1 changed during update"),
		);
		expect(s3Service.copyObject).not.toHaveBeenCalled();
		expect(s3Service.deleteObject).not.toHaveBeenCalled();
		const file = await getFile("1");
		expect(file?.cloudPath).toBe("originals/1/1");
		expect(file?.fileUrl).toBe("https://cdn.permanent.org/old-file-url");
	});

	test("should report an error if looking up the file fails", async () => {
		const testError = new Error("Out of cheese - redo from start");
		vi.spyOn(db, "sql").mockRejectedValue(testError);

		const response = await agent
			.post(endpoint)
			.send({ fileIds: ["1"] })
			.expect(500);

		expect(response.body).toEqual({
			updatedFileIds: [],
			skippedFiles: [],
			fileIdsWithErrors: ["1"],
			fileIdsWithUndeletedOldObjects: [],
		});
		expect(logger.error).toHaveBeenCalledWith(testError);
		expect(s3Service.copyObject).not.toHaveBeenCalled();
	});
});
