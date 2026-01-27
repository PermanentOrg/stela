import { logger } from "@stela/logger";
import request from "supertest";
import { when } from "jest-when";
import { app } from "../../app";
import { db } from "../../database";
import { loadFixtures, clearDatabase } from "./utils_test";
import { mockVerifyUserAuthentication } from "../../../test/middleware_mocks";

jest.mock("../../database");
jest.mock("../../middleware");
jest.mock("@stela/logger");

describe("patch folder", () => {
	const agent = request(app);

	beforeEach(async () => {
		mockVerifyUserAuthentication(
			"test@permanent.org",
			"b5461dc2-1eb0-450e-b710-fef7b2cafe1e",
		);
		await clearDatabase();
		await loadFixtures();
	});

	afterEach(async () => {
		await clearDatabase();
		jest.restoreAllMocks();
		jest.clearAllMocks();
	});

	test("expect an empty query to cause a 400 error", async () => {
		await agent.patch("/api/v2/folder/1").send({}).expect(400);
	});

	test("expect non existent folder to cause a 404 error", async () => {
		await agent
			.patch("/api/v2/folder/111111111")
			.send({ displayDate: "2024-09-26T15:09:52.000Z" })
			.expect(404);
	});

	test("expect request to have an email from auth token if an auth token exists", async () => {
		mockVerifyUserAuthentication("not_an_email");

		await agent.patch("/api/v2/folder/1").expect(400);
	});

	test("expect displayDate is updated", async () => {
		await agent
			.patch("/api/v2/folder/1")
			.send({ displayDate: "2024-09-26T15:09:52" })
			.expect(200);

		const result = await db.query(
			"SELECT to_char(displaydt, 'YYYY-MM-DD HH24:MI:SS') as displaydt FROM folder WHERE folderid = :folderId",
			{
				folderId: 1,
			},
		);

		expect(result.rows[0]).toEqual({ displaydt: "2024-09-26 15:09:52" });
	});

	test("expect displayDate is updated when set to null", async () => {
		await agent
			.patch("/api/v2/folder/1")
			.send({ displayDate: null })
			.expect(200);

		const result = await db.query(
			"SELECT displaydt FROM folder WHERE folderid = :folderId",
			{
				folderId: 1,
			},
		);

		expect(result.rows[0]).toStrictEqual({ displaydt: null });
	});

	test("expect displayTimeInEDTF is updated", async () => {
		await agent
			.patch("/api/v2/folder/1")
			.send({ displayTimeInEDTF: "2024-21" })
			.expect(200);

		const result = await db.query(
			"SELECT displaytime FROM folder WHERE folderid = :folderId",
			{
				folderId: 1,
			},
		);

		expect(result.rows[0]).toEqual({ displaytime: "2024-21" });
	});

	test("expect displayTimeInEDTF is updated when set to null", async () => {
		await agent
			.patch("/api/v2/folder/2")
			.send({ displayTimeInEDTF: null })
			.expect(200);

		const result = await db.query(
			"SELECT displaytime FROM folder WHERE folderid = :folderId",
			{
				folderId: 2,
			},
		);

		expect(result.rows[0]).toEqual({ displaytime: null });
	});

	test("expect 400 error when displayTimeInEDTF is now valid Level 1 EDTF", async () => {
		await agent
			.patch("/api/v2/folder/2")
			.send({ displayTimeInEDTF: "2024-33" })
			.expect(400);
	});

	test("expect 400 error if display date is wrong type", async () => {
		await agent
			.patch("/api/v2/folder/1")
			.send({
				displayDate: false,
			})
			.expect(400);
	});

	test("expect to log error and return 500 if database update fails", async () => {
		const testError = new Error("test error");
		const spy = jest.spyOn(db, "sql").mockImplementation(async () => {
			throw testError;
		});

		await agent
			.patch("/api/v2/folder/1")
			.send({ displayDate: "2024-09-26T15:09:52.000Z" })
			.expect(500);
		spy.mockRestore();

		expect(logger.error).toHaveBeenCalledWith(testError);
	});

	test("expect to log error and return 500 if database update fails", async () => {
		const testError = new Error("test error");
		const sqlSpy = jest.spyOn(db, "sql");
		when(sqlSpy)
			.calledWith("folder.queries.update_folder", {
				folderId: "1",
				displayDate: "2024-09-26T15:09:52.000Z",
				setDisplayDateToNull: false,
				displayEndDate: undefined,
				setDisplayEndDateToNull: false,
				displayTime: undefined,
				setDisplayTimeToNull: false,
			})
			.mockImplementation(async () => {
				throw testError;
			});

		await agent
			.patch("/api/v2/folders/1")
			.send({ displayDate: "2024-09-26T15:09:52.000Z" })
			.expect(500);

		expect(logger.error).toHaveBeenCalledWith(testError);
	});

	test("expect to log error and return 500 if database update is ok but the database select fails", async () => {
		const testError = new Error("test error");
		const sqlSpy = jest.spyOn(db, "sql");
		when(sqlSpy)
			.calledWith("folder.queries.get_folders", {
				folderIds: ["1"],
				email: "test@permanent.org",
				shareToken: undefined,
			})
			.mockImplementation(async () => {
				throw testError;
			});

		await agent
			.patch("/api/v2/folder/1")
			.send({ displayDate: "2024-09-26T15:09:52.000Z" })
			.expect(500);

		expect(logger.error).toHaveBeenCalledWith(testError);
	});

	test("expect to log error and return 404 if database update is ok but the database select has empty result", async () => {
		const sqlSpy = jest.spyOn(db, "sql");
		when(sqlSpy)
			.calledWith("folder.queries.get_folders", {
				folderIds: ["1"],
				email: "test@permanent.org",
				shareToken: undefined,
			})
			.mockImplementationOnce(
				jest.fn().mockResolvedValue({
					rows: [],
				}),
			);

		await agent
			.patch("/api/v2/folder/1")
			.send({ displayDate: "2024-09-26T15:09:52.000Z" })
			.expect(404);
	});

	test("expect 403 forbidden response if user doesn't have edit access rights", async () => {
		mockVerifyUserAuthentication(
			"test+1@permanent.org",
			"b5461dc2-1eb0-450e-b710-fef7b2cafe1e",
		);

		await agent
			.patch("/api/v2/folder/1")
			.send({ displayDate: "2024-09-26T15:09:52" })
			.expect(403);
	});

	test("expect 404 not found response if user doesn't have access rights", async () => {
		mockVerifyUserAuthentication(
			"unknown@permanent.org",
			"b5461dc2-1eb0-450e-b710-fef7b2cafe1e",
		);

		await agent
			.patch("/api/v2/folder/1")
			.send({ displayDate: "2024-09-26T15:09:52" })
			.expect(404);
	});
});
