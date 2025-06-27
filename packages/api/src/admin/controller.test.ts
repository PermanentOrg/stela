import request from "supertest";
import type { Request, NextFunction } from "express";
import createError from "http-errors";
import { logger } from "@stela/logger";
import { app } from "../app";
import { db } from "../database";
import { lowPriorityTopicArn, publisherClient } from "../publisher_client";
import { verifyAdminAuthentication } from "../middleware";
import type { Message } from "../publisher_client";

jest.mock("../database");
jest.mock("@stela/logger");
jest.mock("../middleware");
jest.mock("../publisher_client");

describe("recalculateFolderThumbnails", () => {
	const loadFixtures = async (): Promise<void> => {
		await db.sql("admin.fixtures.create_test_folders");
	};

	const clearDatabase = async (): Promise<void> => {
		await db.query("TRUNCATE folder CASCADE");
	};

	const agent = request(app);
	beforeEach(async () => {
		(verifyAdminAuthentication as jest.Mock).mockImplementation(
			(req: Request, __, next: NextFunction) => {
				const body = req.body as {
					beginTimestamp: Date;
					endTimestamp: Date;
					emailFromAuthToken: string;
					adminSubjectFromAuthToken: string;
				};
				body.emailFromAuthToken = "test@permanent.org";
				body.adminSubjectFromAuthToken = "5c3473b6-cf2e-4c55-a80e-8db51d1bc5fd";
				next();
			},
		);
		jest.clearAllMocks();
		await clearDatabase();
		await loadFixtures();
	});

	afterEach(async () => {
		await clearDatabase();
	});

	test("should send messages for folders created before the cutoff", async () => {
		jest
			.spyOn(publisherClient, "batchPublishMessages")
			.mockResolvedValueOnce({ failedMessages: [], messagesSent: 6 });
		const result = await agent
			.post("/api/v2/admin/folder/recalculate_thumbnails")
			.send({
				beginTimestamp: new Date(new Date().setDate(new Date().getDate() - 1)),
				endTimestamp: new Date(),
			})
			.expect(200);
		expect(
			(
				(
					(publisherClient.batchPublishMessages as jest.Mock).mock.calls[0] as [
						string,
						Message[],
					]
				)[1] as unknown as Message[]
			).length,
		).toBe(6);
		expect(result.body).toEqual({ failedFolders: [], messagesSent: 6 });
	});

	test("should respond with 500 error if messages fail to send", async () => {
		jest
			.spyOn(publisherClient, "batchPublishMessages")
			.mockResolvedValueOnce({ failedMessages: ["1", "2"], messagesSent: 2 });
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
		jest.spyOn(db, "sql").mockRejectedValueOnce(testError);
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
		jest
			.spyOn(publisherClient, "batchPublishMessages")
			.mockRejectedValueOnce(testError);
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
		(verifyAdminAuthentication as jest.Mock).mockImplementation(
			(req: Request, __, next: NextFunction) => {
				const body = req.body as {
					emailFromAuthToken: string;
					adminSubjectFromAuthToken: string;
				};
				body.emailFromAuthToken = "test@permanent.org";
				body.adminSubjectFromAuthToken = "5c3473b6-cf2e-4c55-a80e-8db51d1bc5fd";
				next();
			},
		);
		jest.clearAllMocks();
		await clearDatabase();
		await loadFixtures();
	});

	afterEach(async () => {
		await clearDatabase();
	});

	test("should respond with 200 for a successful request", async () => {
		await agent
			.post("/api/v2/admin/account/set_null_subjects")
			.send({ accounts: [] })
			.expect(200);
	});

	test("should respond with 401 if not authenticated", async () => {
		(verifyAdminAuthentication as jest.Mock).mockImplementation(
			(_, __, next: NextFunction) => {
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
		jest.spyOn(db, "sql").mockRejectedValueOnce(testError);

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
		jest.spyOn(db, "sql").mockRejectedValueOnce(testError);

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
		await db.sql("admin.fixtures.create_test_accounts");
		await db.sql("admin.fixtures.create_test_archives");
		await db.sql("admin.fixtures.create_test_records");
		await db.sql("admin.fixtures.create_test_folders");
		await db.sql("admin.fixtures.create_test_folder_links");
	};

	const clearDatabase = async (): Promise<void> => {
		await db.query(
			"TRUNCATE account, archive, record, folder, folder_link CASCADE",
		);
	};

	beforeEach(async () => {
		(verifyAdminAuthentication as jest.Mock).mockImplementation(
			(req: Request, __, next: NextFunction) => {
				req.body = {
					emailFromAuthToken: "test@permanent.org",
					adminSubjectFromAuthToken: "5c3473b6-cf2e-4c55-a80e-8db51d1bc5fd",
				};
				next();
			},
		);
		jest.clearAllMocks();
		await clearDatabase();
		await loadFixtures();
	});

	afterEach(async () => {
		await clearDatabase();
	});

	test("should response with 401 if not authenticated as an admin", async () => {
		(verifyAdminAuthentication as jest.Mock).mockImplementation(
			(_, __, next: NextFunction) => {
				next(new createError.Unauthorized("Invalid token"));
			},
		);
		await agent
			.post("/api/v2/admin/record/1/recalculate_thumbnail")
			.expect(401);
	});

	test("should publish a message with correct parameters", async () => {
		(publisherClient.batchPublishMessages as jest.Mock).mockResolvedValueOnce({
			failedMessages: [],
			messagesSent: 1,
		});
		await agent
			.post("/api/v2/admin/record/1/recalculate_thumbnail")
			.expect(200);

		expect(publisherClient.batchPublishMessages).toHaveBeenCalled();
		const publishMessages = (
			(publisherClient.batchPublishMessages as jest.Mock).mock.calls[0] as [
				string,
				Message[],
			]
		)[1] as unknown as Message[];
		if (publishMessages[0]) {
			const publishBody = JSON.parse(publishMessages[0].body) as {
				parameters: string[];
			};
			expect(publishBody.parameters.length).toBe(6);
			expect(publishBody.parameters[1]).toBe("1");
			expect(publishBody.parameters[2]).toBe("1");
			expect(publishBody.parameters[3]).toBe("1");
		} else {
			expect(true).toBe(false);
		}
	});

	test("should respond with 404 if the record doesn't exist", async () => {
		await agent
			.post("/api/v2/admin/record/1000/recalculate_thumbnail")
			.expect(404);
	});

	test("should respond with 500 if the message fails to send", async () => {
		jest
			.spyOn(publisherClient, "batchPublishMessages")
			.mockResolvedValueOnce({ failedMessages: ["1"], messagesSent: 0 });
		await agent
			.post("/api/v2/admin/record/1/recalculate_thumbnail")
			.expect(500);
	});

	test("should respond with 500  and log the error if the database call fails", async () => {
		const testError = new Error("out of cheese - redo from start");
		jest.spyOn(db, "sql").mockRejectedValueOnce(testError);

		await agent
			.post("/api/v2/admin/record/1/recalculate_thumbnail")
			.expect(500);
		expect(logger.error).toHaveBeenCalledWith(testError);
	});
});

describe("/folder/delete-orphaned-folders", () => {
	const agent = request(app);

	const loadFixtures = async (): Promise<void> => {
		await db.sql("admin.fixtures.create_test_accounts");
		await db.sql("admin.fixtures.create_test_archives");
		await db.sql("admin.fixtures.create_test_folders");
		await db.sql("admin.fixtures.create_test_records");
		await db.sql("admin.fixtures.create_test_folder_links");
	};

	beforeEach(async () => {
		(verifyAdminAuthentication as jest.Mock).mockImplementation(
			(req: Request, __, next: NextFunction) => {
				req.body = {
					emailFromAuthToken: "test@permanent.org",
					adminSubjectFromAuthToken: "5c3473b6-cf2e-4c55-a80e-8db51d1bc5fd",
				};
				next();
			},
		);
		(publisherClient.batchPublishMessages as jest.Mock).mockResolvedValue({
			failedMessages: [],
			messagesSent: 2,
		});

		await loadFixtures();
	});

	afterEach(async () => {
		await db.query(
			"TRUNCATE account, archive, folder, record, folder_link CASCADE",
		);
		jest.clearAllMocks();
	});

	test("should respond with 401 if not authenticated as an admin", async () => {
		(verifyAdminAuthentication as jest.Mock).mockImplementation(
			(_, __, next: NextFunction) => {
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
		(publisherClient.batchPublishMessages as jest.Mock).mockRejectedValue(
			testError,
		);

		await agent
			.post("/api/v2/admin/folder/delete-orphaned-folders")
			.expect(500);
		expect(logger.error).toHaveBeenCalledWith(testError);
	});

	test("should respond with a 500 error if database call fails", async () => {
		const testError = new Error("Out of cheese - redo from start");
		jest.spyOn(db, "sql").mockRejectedValue(testError);

		await agent
			.post("/api/v2/admin/folder/delete-orphaned-folders")
			.expect(500);
		expect(logger.error).toHaveBeenCalledWith(testError);
	});
});
