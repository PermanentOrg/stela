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
		await agent.patch("/api/v2/folders/1").send({}).expect(400);
	});

	test("expect non existent folder to cause a 404 error", async () => {
		await agent
			.patch("/api/v2/folders/111111111")
			.send({ displayDate: "2024-09-26T15:09:52.000Z" })
			.expect(404);
	});

	test("expect request to have an email from auth token if an auth token exists", async () => {
		mockVerifyUserAuthentication("not_an_email");

		await agent.patch("/api/v2/folders/1").expect(400);
	});

	test("expect displayDate is updated", async () => {
		await agent
			.patch("/api/v2/folders/1")
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
			.patch("/api/v2/folders/1")
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
			.patch("/api/v2/folders/1")
			.send({ displayTimeInEDTF: "2024-1X" })
			.expect(200);

		const result = await db.query(
			"SELECT displaytime FROM folder WHERE folderid = :folderId",
			{
				folderId: 1,
			},
		);

		expect(result.rows[0]).toEqual({ displaytime: "2024-1X" });
	});

	test("expect displayTimeInEDTF is updated when set to null", async () => {
		await agent
			.patch("/api/v2/folders/2")
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

	test("expect 400 error when displayTimeInEDTF is not valid Level 1 EDTF", async () => {
		await agent
			.patch("/api/v2/folders/2")
			.send({ displayTimeInEDTF: "2024-33" })
			.expect(400);
	});

	test("expect 400 error if display date is wrong type", async () => {
		await agent
			.patch("/api/v2/folders/1")
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
			.patch("/api/v2/folders/1")
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
			.patch("/api/v2/folders/1")
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
			.patch("/api/v2/folders/1")
			.send({ displayDate: "2024-09-26T15:09:52.000Z" })
			.expect(404);
	});

	test("expect 403 forbidden response if user doesn't have edit access rights", async () => {
		mockVerifyUserAuthentication(
			"test+1@permanent.org",
			"b5461dc2-1eb0-450e-b710-fef7b2cafe1e",
		);

		await agent
			.patch("/api/v2/folders/1")
			.send({ displayDate: "2024-09-26T15:09:52" })
			.expect(403);
	});

	test("expect 404 not found response if user doesn't have access rights", async () => {
		mockVerifyUserAuthentication(
			"unknown@permanent.org",
			"b5461dc2-1eb0-450e-b710-fef7b2cafe1e",
		);

		await agent
			.patch("/api/v2/folders/1")
			.send({ displayDate: "2024-09-26T15:09:52" })
			.expect(404);
	});

	describe("displaytimelowerbound tests", () => {
		test("expect displaytimelowerbound is set for year only (YYYY)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTimeInEDTF: "2024" })
				.expect(200);

			const result = await db.query(
				"SELECT to_char(displaytimelowerbound, 'YYYY-MM-DD HH24:MI:SS') as displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({
				displaytimelowerbound: "2024-01-01 00:00:00",
			});
		});

		test("expect displaytimelowerbound is set for year-month (YYYY-MM)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTimeInEDTF: "2024-06" })
				.expect(200);

			const result = await db.query(
				"SELECT to_char(displaytimelowerbound, 'YYYY-MM-DD HH24:MI:SS') as displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({
				displaytimelowerbound: "2024-06-01 00:00:00",
			});
		});

		test("expect displaytimelowerbound is set for full date (YYYY-MM-DD)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTimeInEDTF: "2024-06-15" })
				.expect(200);

			const result = await db.query(
				"SELECT to_char(displaytimelowerbound, 'YYYY-MM-DD HH24:MI:SS') as displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({
				displaytimelowerbound: "2024-06-15 00:00:00",
			});
		});

		test("expect displaytimelowerbound is set for date with time (YYYY-MM-DDTHH:MM:SS)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTimeInEDTF: "2024-06-15T14:30:45" })
				.expect(200);

			const result = await db.query(
				"SELECT to_char(displaytimelowerbound, 'YYYY-MM-DD HH24:MI:SS') as displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({
				displaytimelowerbound: "2024-06-15 14:30:45",
			});
		});

		test("expect displaytimelowerbound is set for date with UTC timezone (YYYY-MM-DDTHH:MM:SSZ)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTimeInEDTF: "2024-06-15T14:30:45Z" })
				.expect(200);

			const result = await db.query(
				"SELECT to_char(displaytimelowerbound AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS') as displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({
				displaytimelowerbound: "2024-06-15 14:30:45",
			});
		});

		test("expect displaytimelowerbound is set for date with timezone offset (YYYY-MM-DDTHH:MM:SS+HH:MM)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTimeInEDTF: "2024-06-15T14:30:45-07:00" })
				.expect(200);

			const result = await db.query(
				"SELECT to_char(displaytimelowerbound AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS') as displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({
				displaytimelowerbound: "2024-06-15 21:30:45",
			});
		});

		test("expect displaytimelowerbound is set for uncertain date (YYYY-MM-DD?)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTimeInEDTF: "2024-06-15?" })
				.expect(200);

			const result = await db.query(
				"SELECT to_char(displaytimelowerbound, 'YYYY-MM-DD HH24:MI:SS') as displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({
				displaytimelowerbound: "2024-06-15 00:00:00",
			});
		});

		test("expect displaytimelowerbound is set for uncertain year (YYYY?)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTimeInEDTF: "2024?" })
				.expect(200);

			const result = await db.query(
				"SELECT to_char(displaytimelowerbound, 'YYYY-MM-DD HH24:MI:SS') as displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({
				displaytimelowerbound: "2024-01-01 00:00:00",
			});
		});

		test("expect displaytimelowerbound is set for uncertain year-month (YYYY-MM?)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTimeInEDTF: "2024-06?" })
				.expect(200);

			const result = await db.query(
				"SELECT to_char(displaytimelowerbound, 'YYYY-MM-DD HH24:MI:SS') as displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({
				displaytimelowerbound: "2024-06-01 00:00:00",
			});
		});

		test("expect displaytimelowerbound is set for approximate date (YYYY-MM-DD~)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTimeInEDTF: "2024-06-15~" })
				.expect(200);

			const result = await db.query(
				"SELECT to_char(displaytimelowerbound, 'YYYY-MM-DD HH24:MI:SS') as displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({
				displaytimelowerbound: "2024-06-15 00:00:00",
			});
		});

		test("expect displaytimelowerbound is set for uncertain and approximate date (YYYY-MM-DD%)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTimeInEDTF: "2024-06-15%" })
				.expect(200);

			const result = await db.query(
				"SELECT to_char(displaytimelowerbound, 'YYYY-MM-DD HH24:MI:SS') as displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({
				displaytimelowerbound: "2024-06-15 00:00:00",
			});
		});

		test("expect displaytimelowerbound is set for uncertain and approximate year (YYYY%)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTimeInEDTF: "2024%" })
				.expect(200);

			const result = await db.query(
				"SELECT to_char(displaytimelowerbound, 'YYYY-MM-DD HH24:MI:SS') as displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({
				displaytimelowerbound: "2024-01-01 00:00:00",
			});
		});

		test("expect displaytimelowerbound is set for unspecified day (YYYY-MM-XX)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTimeInEDTF: "2024-06-XX" })
				.expect(200);

			const result = await db.query(
				"SELECT to_char(displaytimelowerbound, 'YYYY-MM-DD HH24:MI:SS') as displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({
				displaytimelowerbound: "2024-06-01 00:00:00",
			});
		});

		test("expect displaytimelowerbound is set for unspecified month (YYYY-XX)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTimeInEDTF: "2024-XX" })
				.expect(200);

			const result = await db.query(
				"SELECT to_char(displaytimelowerbound, 'YYYY-MM-DD HH24:MI:SS') as displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({
				displaytimelowerbound: "2024-01-01 00:00:00",
			});
		});

		test("expect displaytimelowerbound is set for unspecified year digits (19XX)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTimeInEDTF: "19XX" })
				.expect(200);

			const result = await db.query(
				"SELECT to_char(displaytimelowerbound, 'YYYY-MM-DD HH24:MI:SS') as displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({
				displaytimelowerbound: "1900-01-01 00:00:00",
			});
		});

		test("expect displaytimelowerbound is set for multiple unspecified digits (1XXX)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTimeInEDTF: "1XXX" })
				.expect(200);

			const result = await db.query(
				"SELECT to_char(displaytimelowerbound, 'YYYY-MM-DD HH24:MI:SS') as displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({
				displaytimelowerbound: "1000-01-01 00:00:00",
			});
		});

		test("expect displaytimelowerbound is -infinity for completely unspecified year (XXXX)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTimeInEDTF: "XXXX" })
				.expect(200);

			const result = await db.query(
				"SELECT displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({ displaytimelowerbound: -Infinity });
		});

		test("expect displaytimelowerbound is set for full interval (YYYY-MM-DD/YYYY-MM-DD)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTimeInEDTF: "2024-01-15/2024-06-15" })
				.expect(200);

			const result = await db.query(
				"SELECT to_char(displaytimelowerbound, 'YYYY-MM-DD HH24:MI:SS') as displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({
				displaytimelowerbound: "2024-01-15 00:00:00",
			});
		});

		test("expect displaytimelowerbound is set for interval with open end (YYYY-MM-DD/..)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTimeInEDTF: "2024-01-15/.." })
				.expect(200);

			const result = await db.query(
				"SELECT to_char(displaytimelowerbound, 'YYYY-MM-DD HH24:MI:SS') as displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({
				displaytimelowerbound: "2024-01-15 00:00:00",
			});
		});

		test("expect displaytimelowerbound is -infinity for interval with open start (../YYYY-MM-DD)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTimeInEDTF: "../2024-06-15" })
				.expect(200);

			const result = await db.query(
				"SELECT displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({ displaytimelowerbound: -Infinity });
		});

		test("expect displaytimelowerbound is -infinity for interval with unknown start (/YYYY-MM-DD)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTimeInEDTF: "/2024-06-15" })
				.expect(200);

			const result = await db.query(
				"SELECT displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({ displaytimelowerbound: -Infinity });
		});

		test("expect displaytimelowerbound is set for year interval (YYYY/YYYY)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTimeInEDTF: "2020/2024" })
				.expect(200);

			const result = await db.query(
				"SELECT to_char(displaytimelowerbound, 'YYYY-MM-DD HH24:MI:SS') as displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({
				displaytimelowerbound: "2020-01-01 00:00:00",
			});
		});

		test("expect displaytimelowerbound is set for spring (YYYY-21)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTimeInEDTF: "2024-21" })
				.expect(200);

			const result = await db.query(
				"SELECT to_char(displaytimelowerbound, 'YYYY-MM-DD HH24:MI:SS') as displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({
				displaytimelowerbound: "2024-03-01 00:00:00",
			});
		});

		test("expect displaytimelowerbound is set for summer (YYYY-22)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTimeInEDTF: "2024-22" })
				.expect(200);

			const result = await db.query(
				"SELECT to_char(displaytimelowerbound, 'YYYY-MM-DD HH24:MI:SS') as displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({
				displaytimelowerbound: "2024-06-01 00:00:00",
			});
		});

		test("expect displaytimelowerbound is set for autumn (YYYY-23)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTimeInEDTF: "2024-23" })
				.expect(200);

			const result = await db.query(
				"SELECT to_char(displaytimelowerbound, 'YYYY-MM-DD HH24:MI:SS') as displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({
				displaytimelowerbound: "2024-09-01 00:00:00",
			});
		});

		test("expect displaytimelowerbound is set for winter (YYYY-24)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTimeInEDTF: "2024-24" })
				.expect(200);

			const result = await db.query(
				"SELECT to_char(displaytimelowerbound, 'YYYY-MM-DD HH24:MI:SS') as displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({
				displaytimelowerbound: "2024-12-01 00:00:00",
			});
		});

		test("expect displaytimelowerbound is set for uncertain season (YYYY-21?)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTimeInEDTF: "2024-21?" })
				.expect(200);

			const result = await db.query(
				"SELECT to_char(displaytimelowerbound, 'YYYY-MM-DD HH24:MI:SS') as displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({
				displaytimelowerbound: "2024-03-01 00:00:00",
			});
		});

		test("expect displaytimelowerbound is set for five-digit year (Y17000)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTimeInEDTF: "Y17000" })
				.expect(200);

			const result = await db.query(
				"SELECT to_char(displaytimelowerbound, 'YYYY-MM-DD HH24:MI:SS') as displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({
				displaytimelowerbound: "17000-01-01 00:00:00",
			});
		});

		test("expect displaytimelowerbound is set for negative year after 4000 BC (-3000)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTimeInEDTF: "-3000" })
				.expect(200);

			const result = await db.query(
				"SELECT to_char(displaytimelowerbound, 'YYYY-MM-DD HH24:MI:SS AD') as displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({
				displaytimelowerbound: "3000-01-01 00:00:00 BC",
			});
		});

		test("expect displaytimelowerbound is -infinity for year before PostgreSQL timestamp range (Y-10000)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTimeInEDTF: "Y-10000" })
				.expect(200);

			const result = await db.query(
				"SELECT displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({ displaytimelowerbound: -Infinity });
		});

		test("expect displaytimelowerbound is infinity for year after PostgreSQL timestamp range (Y300000)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTimeInEDTF: "Y300000" })
				.expect(200);

			const result = await db.query(
				"SELECT displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({ displaytimelowerbound: Infinity });
		});

		test("expect displaytimelowerbound is set for unspecified day with uncertainty (YYYY-MM-XX?)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTimeInEDTF: "2024-06-XX?" })
				.expect(200);

			const result = await db.query(
				"SELECT to_char(displaytimelowerbound, 'YYYY-MM-DD HH24:MI:SS') as displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({
				displaytimelowerbound: "2024-06-01 00:00:00",
			});
		});

		test("expect displaytimelowerbound is set for interval with uncertain dates (YYYY-MM-DD?/YYYY-MM-DD?)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTimeInEDTF: "2024-01-15?/2024-06-15?" })
				.expect(200);

			const result = await db.query(
				"SELECT to_char(displaytimelowerbound, 'YYYY-MM-DD HH24:MI:SS') as displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({
				displaytimelowerbound: "2024-01-15 00:00:00",
			});
		});

		test("expect displaytimelowerbound is set to null when displayTimeInEDTF is set to null", async () => {
			// First set a displayTimeInEDTF
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTimeInEDTF: "2024-06-15" })
				.expect(200);

			// Then set it to null
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTimeInEDTF: null })
				.expect(200);

			const result = await db.query(
				"SELECT displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toStrictEqual({ displaytimelowerbound: null });
		});
	});
});
