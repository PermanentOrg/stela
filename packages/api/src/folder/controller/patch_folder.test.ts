import { logger } from "@stela/logger";
import { vi } from "vitest";
import request from "supertest";
import { when } from "vitest-when";
import { app } from "../../app";
import { db } from "../../database";
import { loadFixtures, clearDatabase } from "./utils_test";
import { mockVerifyUserAuthentication } from "../../../test/middleware_mocks";

vi.mock("../../database");
vi.mock("../../middleware");
vi.mock("@stela/logger");

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
		vi.restoreAllMocks();
		vi.resetAllMocks();
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

	test("expect displayTime is updated", async () => {
		await agent
			.patch("/api/v2/folders/1")
			.send({ displayTime: "2024-1X" })
			.expect(200);

		const result = await db.query(
			"SELECT displaytime FROM folder WHERE folderid = :folderId",
			{
				folderId: 1,
			},
		);

		expect(result.rows[0]).toEqual({ displaytime: "2024-1X" });
	});

	test("expect displayTime is updated when set to null", async () => {
		await agent
			.patch("/api/v2/folders/2")
			.send({ displayTime: null })
			.expect(200);

		const result = await db.query(
			"SELECT displaytime FROM folder WHERE folderid = :folderId",
			{
				folderId: 2,
			},
		);

		expect(result.rows[0]).toEqual({ displaytime: null });
	});

	test("expect 400 error when displayTime is not valid Level 2 EDTF", async () => {
		await agent
			.patch("/api/v2/folders/2")
			.send({ displayTime: "2024-42" })
			.expect(400);
	});

	test("expect 400 error with detail if displayTime interval end is before start", async () => {
		const response = await agent
			.patch("/api/v2/folders/2")
			.send({ displayTime: "2020/2019" })
			.expect(400);
		expect(response.text).toContain(
			"Interval start must be before or equal to end",
		);
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
		const spy = vi.spyOn(db, "sql").mockImplementation(async () => {
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
		const sqlSpy = vi.spyOn(db, "sql");
		when(sqlSpy)
			.calledWith("folder.queries.update_folder", {
				folderId: "1",
				displayDate: "2024-09-26T15:09:52.000Z",
				setDisplayDateToNull: false,
				displayEndDate: undefined,
				setDisplayEndDateToNull: false,
				displayTime: undefined,
				setDisplayTimeToNull: false,
				locationId: null,
			})
			.thenReject(testError);

		await agent
			.patch("/api/v2/folders/1")
			.send({ displayDate: "2024-09-26T15:09:52.000Z" })
			.expect(500);

		expect(logger.error).toHaveBeenCalledWith(testError);
	});

	test("expect to log error and return 500 if database update is ok but the database select fails", async () => {
		const testError = new Error("test error");
		const sqlSpy = vi.spyOn(db, "sql");
		when(sqlSpy)
			.calledWith("folder.queries.get_folders", {
				folderIds: ["1"],
				email: "test@permanent.org",
				shareToken: undefined,
			})
			.thenReject(testError);

		await agent
			.patch("/api/v2/folders/1")
			.send({ displayDate: "2024-09-26T15:09:52.000Z" })
			.expect(500);

		expect(logger.error).toHaveBeenCalledWith(testError);
	});

	test("expect 404 if update_folder returns no rows", async () => {
		const sqlSpy = vi.spyOn(db, "sql");
		when(sqlSpy)
			.calledWith("folder.queries.update_folder", {
				folderId: "1",
				displayDate: "2024-09-26T15:09:52.000Z",
				setDisplayDateToNull: false,
				displayEndDate: undefined,
				setDisplayEndDateToNull: false,
				displayTime: undefined,
				setDisplayTimeToNull: false,
				locationId: null,
			})
			.thenDo(vi.fn().mockResolvedValue({ rows: [] }));

		await agent
			.patch("/api/v2/folders/1")
			.send({ displayDate: "2024-09-26T15:09:52.000Z" })
			.expect(404);
	});

	test("expect to log error and return 404 if database update is ok but the database select has empty result", async () => {
		const sqlSpy = vi.spyOn(db, "sql");
		when(sqlSpy)
			.calledWith("folder.queries.get_folders", {
				folderIds: ["1"],
				email: "test@permanent.org",
				shareToken: undefined,
			})
			.thenDo(vi.fn().mockResolvedValue({ rows: [] }));

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

	describe("nested location updates", () => {
		test("expect a nested location to update the existing location row", async () => {
			await agent
				.patch("/api/v2/folders/2")
				.send({
					location: {
						name: "New Place",
						city: "Lyon",
						country: "France",
						latitude: 45.764,
						longitude: 4.8357,
						precision: "approximate",
					},
				})
				.expect(200);

			const folderResult = await db.query(
				`SELECT locnid AS "locationId" FROM folder WHERE folderid = :folderId`,
				{ folderId: 2 },
			);
			expect(folderResult.rows[0]).toEqual({ locationId: "1" });

			const locationResult = await db.query(
				"SELECT name, city, country, latitude, longitude, locationprecision FROM locn WHERE locnid = 1",
			);
			expect(locationResult.rows[0]).toEqual({
				name: "New Place",
				city: "Lyon",
				country: "France",
				latitude: 45.764,
				longitude: 4.8357,
				locationprecision: "approximate",
			});
		});

		test("expect a nested location partial update to preserve untouched fields", async () => {
			await agent
				.patch("/api/v2/folders/2")
				.send({ location: { city: "Marseille" } })
				.expect(200);

			const locationResult = await db.query(
				"SELECT name, city FROM locn WHERE locnid = 1",
			);
			expect(locationResult.rows[0]).toEqual({
				name: "Jean Valjean's House",
				city: "Marseille",
			});
		});

		test("expect a nested location to create a new location when folder has none", async () => {
			await agent
				.patch("/api/v2/folders/1")
				.send({
					location: {
						name: "Brand New Place",
						city: "Marseille",
						country: "France",
						latitude: 43.2965,
						longitude: 5.3698,
						precision: "approximate",
					},
				})
				.expect(200);

			const folderResult = await db.query<{ locationId: string }>(
				`SELECT locnid AS "locationId" FROM folder WHERE folderid = :folderId`,
				{ folderId: 1 },
			);
			const newLocationId = folderResult.rows[0]?.locationId;
			expect(newLocationId).not.toBeNull();
			expect(newLocationId).not.toBe("1");

			const locationResult = await db.query(
				"SELECT name, city, country FROM locn WHERE locnid = :locationId",
				{ locationId: newLocationId },
			);
			expect(locationResult.rows[0]).toEqual({
				name: "Brand New Place",
				city: "Marseille",
				country: "France",
			});
		});

		test("expect 400 error if location is an empty object", async () => {
			await agent.patch("/api/v2/folders/1").send({ location: {} }).expect(400);
		});

		test("expect 404 if folder disappears between access check and location lookup", async () => {
			const sqlSpy = vi.spyOn(db, "sql");
			when(sqlSpy)
				.calledWith("folder.queries.get_folder_location_id", { folderId: "1" })
				.thenDo(vi.fn().mockResolvedValue({ rows: [] }));

			await agent
				.patch("/api/v2/folders/1")
				.send({ location: { name: "Test" } })
				.expect(404);
		});

		test("expect 500 if the folder location lookup query fails", async () => {
			const testError = new Error("test error");
			const sqlSpy = vi.spyOn(db, "sql");
			when(sqlSpy)
				.calledWith("folder.queries.get_folder_location_id", { folderId: "1" })
				.thenReject(testError);

			await agent
				.patch("/api/v2/folders/1")
				.send({ location: { name: "Test" } })
				.expect(500);

			expect(logger.error).toHaveBeenCalledWith(testError);
		});

		test("expect 400 error if a location field is the wrong type", async () => {
			await agent
				.patch("/api/v2/folders/1")
				.send({ location: { latitude: "not a number" } })
				.expect(400);
		});

		test("expect deprecated location fields to be rejected", async () => {
			await agent
				.patch("/api/v2/folders/2")
				.send({
					location: {
						streetNumber: "1600",
						streetName: "Pennsylvania Avenue",
					},
				})
				.expect(400);
		});

		test("expect legacy columns to be derived from new fields on insert", async () => {
			await agent
				.patch("/api/v2/folders/1")
				.send({
					location: {
						name: "The White House",
						sublocation: "1600 Pennsylvania Avenue",
						city: "Washington",
						state: "DC",
						country: "United States",
					},
				})
				.expect(200);

			const locationResult = await db.query<{
				locnid: string;
				streetnumber: string | null;
				streetname: string | null;
				locality: string | null;
			}>(
				`SELECT locnid::text AS locnid, streetnumber, streetname, locality
				 FROM locn ORDER BY locnid DESC LIMIT 1`,
			);
			expect(locationResult.rows[0]).toMatchObject({
				streetnumber: "1600",
				streetname: "Pennsylvania Avenue",
				locality: "Washington",
			});
		});

		test("expect derived legacy columns to be updated when their source fields are patched", async () => {
			await agent
				.patch("/api/v2/folders/2")
				.send({ location: { city: "Marseille" } })
				.expect(200);

			const locationResult = await db.query(
				"SELECT locality FROM locn WHERE locnid = 1",
			);
			expect(locationResult.rows[0]).toEqual({ locality: "Marseille" });
		});
	});

	describe("displaytimelowerbound tests", () => {
		test("expect displaytimelowerbound is set for year only (YYYY)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTime: "2024" })
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
				.send({ displayTime: "2024-06" })
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
				.send({ displayTime: "2024-06-15" })
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
				.send({ displayTime: "2024-06-15T14:30:45" })
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
				.send({ displayTime: "2024-06-15T14:30:45Z" })
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
				.send({ displayTime: "2024-06-15T14:30:45-07:00" })
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
				.send({ displayTime: "2024-06-15?" })
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
				.send({ displayTime: "2024?" })
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
				.send({ displayTime: "2024-06?" })
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
				.send({ displayTime: "2024-06-15~" })
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
				.send({ displayTime: "2024-06-15%" })
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
				.send({ displayTime: "2024%" })
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
				.send({ displayTime: "2024-06-XX" })
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
				.send({ displayTime: "2024-XX" })
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
				.send({ displayTime: "19XX" })
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
				.send({ displayTime: "1XXX" })
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
				.send({ displayTime: "XXXX" })
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
				.send({ displayTime: "2024-01-15/2024-06-15" })
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
				.send({ displayTime: "2024-01-15/.." })
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
				.send({ displayTime: "../2024-06-15" })
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
				.send({ displayTime: "/2024-06-15" })
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
				.send({ displayTime: "2020/2024" })
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
				.send({ displayTime: "2024-21" })
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
				.send({ displayTime: "2024-22" })
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
				.send({ displayTime: "2024-23" })
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
				.send({ displayTime: "2024-24" })
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
				.send({ displayTime: "2024-21?" })
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
				.send({ displayTime: "Y17000" })
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
				.send({ displayTime: "-3000" })
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
				.send({ displayTime: "Y-10000" })
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
				.send({ displayTime: "Y300000" })
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
				.send({ displayTime: "2024-06-XX?" })
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
				.send({ displayTime: "2024-01-15?/2024-06-15?" })
				.expect(200);

			const result = await db.query(
				"SELECT to_char(displaytimelowerbound, 'YYYY-MM-DD HH24:MI:SS') as displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({
				displaytimelowerbound: "2024-01-15 00:00:00",
			});
		});

		test("expect displaytimelowerbound is set to null when displayTime is set to null", async () => {
			// First set a displayTime
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTime: "2024-06-15" })
				.expect(200);

			// Then set it to null
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTime: null })
				.expect(200);

			const result = await db.query(
				"SELECT displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toStrictEqual({ displaytimelowerbound: null });
		});

		test("expect displaytimelowerbound is set for southern hemisphere spring (YYYY-29)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTime: "2024-29" })
				.expect(200);

			const result = await db.query(
				"SELECT to_char(displaytimelowerbound, 'YYYY-MM-DD HH24:MI:SS') as displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({
				displaytimelowerbound: "2024-09-01 00:00:00",
			});
		});

		test("expect displaytimelowerbound is set for southern hemisphere summer (YYYY-30)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTime: "2024-30" })
				.expect(200);

			const result = await db.query(
				"SELECT to_char(displaytimelowerbound, 'YYYY-MM-DD HH24:MI:SS') as displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({
				displaytimelowerbound: "2024-12-01 00:00:00",
			});
		});

		test("expect displaytimelowerbound is set for southern hemisphere autumn (YYYY-31)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTime: "2024-31" })
				.expect(200);

			const result = await db.query(
				"SELECT to_char(displaytimelowerbound, 'YYYY-MM-DD HH24:MI:SS') as displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({
				displaytimelowerbound: "2024-03-01 00:00:00",
			});
		});

		test("expect displaytimelowerbound is set for southern hemisphere winter (YYYY-32)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTime: "2024-32" })
				.expect(200);

			const result = await db.query(
				"SELECT to_char(displaytimelowerbound, 'YYYY-MM-DD HH24:MI:SS') as displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({
				displaytimelowerbound: "2024-06-01 00:00:00",
			});
		});

		test("expect displaytimelowerbound is set for quarter 1 (YYYY-33)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTime: "2024-33" })
				.expect(200);

			const result = await db.query(
				"SELECT to_char(displaytimelowerbound, 'YYYY-MM-DD HH24:MI:SS') as displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({
				displaytimelowerbound: "2024-01-01 00:00:00",
			});
		});

		test("expect displaytimelowerbound is set for quarter 2 (YYYY-34)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTime: "2024-34" })
				.expect(200);

			const result = await db.query(
				"SELECT to_char(displaytimelowerbound, 'YYYY-MM-DD HH24:MI:SS') as displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({
				displaytimelowerbound: "2024-04-01 00:00:00",
			});
		});

		test("expect displaytimelowerbound is set for quarter 3 (YYYY-35)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTime: "2024-35" })
				.expect(200);

			const result = await db.query(
				"SELECT to_char(displaytimelowerbound, 'YYYY-MM-DD HH24:MI:SS') as displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({
				displaytimelowerbound: "2024-07-01 00:00:00",
			});
		});

		test("expect displaytimelowerbound is set for quarter 4 (YYYY-36)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTime: "2024-36" })
				.expect(200);

			const result = await db.query(
				"SELECT to_char(displaytimelowerbound, 'YYYY-MM-DD HH24:MI:SS') as displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({
				displaytimelowerbound: "2024-10-01 00:00:00",
			});
		});

		test("expect displaytimelowerbound is set for quadrimester 1 (YYYY-37)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTime: "2024-37" })
				.expect(200);

			const result = await db.query(
				"SELECT to_char(displaytimelowerbound, 'YYYY-MM-DD HH24:MI:SS') as displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({
				displaytimelowerbound: "2024-01-01 00:00:00",
			});
		});

		test("expect displaytimelowerbound is set for quadrimester 2 (YYYY-38)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTime: "2024-38" })
				.expect(200);

			const result = await db.query(
				"SELECT to_char(displaytimelowerbound, 'YYYY-MM-DD HH24:MI:SS') as displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({
				displaytimelowerbound: "2024-05-01 00:00:00",
			});
		});

		test("expect displaytimelowerbound is set for quadrimester 3 (YYYY-39)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTime: "2024-39" })
				.expect(200);

			const result = await db.query(
				"SELECT to_char(displaytimelowerbound, 'YYYY-MM-DD HH24:MI:SS') as displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({
				displaytimelowerbound: "2024-09-01 00:00:00",
			});
		});

		test("expect displaytimelowerbound is set for semestral 1 (YYYY-40)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTime: "2024-40" })
				.expect(200);

			const result = await db.query(
				"SELECT to_char(displaytimelowerbound, 'YYYY-MM-DD HH24:MI:SS') as displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({
				displaytimelowerbound: "2024-01-01 00:00:00",
			});
		});

		test("expect displaytimelowerbound is set for semestral 2 (YYYY-41)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTime: "2024-41" })
				.expect(200);

			const result = await db.query(
				"SELECT to_char(displaytimelowerbound, 'YYYY-MM-DD HH24:MI:SS') as displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({
				displaytimelowerbound: "2024-07-01 00:00:00",
			});
		});

		test("expect displaytimelowerbound is set for significant digits (1950S2)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTime: "1950S2" })
				.expect(200);

			const result = await db.query(
				"SELECT to_char(displaytimelowerbound, 'YYYY-MM-DD HH24:MI:SS') as displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({
				displaytimelowerbound: "1950-01-01 00:00:00",
			});
		});

		test("expect displaytimelowerbound is infinity for positive exponential year beyond PostgreSQL range (Y17E7)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTime: "Y17E7" })
				.expect(200);

			const result = await db.query(
				"SELECT displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({ displaytimelowerbound: Infinity });
		});

		test("expect displaytimelowerbound is -infinity for negative exponential year beyond PostgreSQL range (Y-17E7)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTime: "Y-17E7" })
				.expect(200);

			const result = await db.query(
				"SELECT displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({ displaytimelowerbound: -Infinity });
		});

		test("expect displaytimelowerbound is set for uncertain year component (?YYYY-MM-DD)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTime: "?2004-06-11" })
				.expect(200);

			const result = await db.query(
				"SELECT to_char(displaytimelowerbound, 'YYYY-MM-DD HH24:MI:SS') as displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({
				displaytimelowerbound: "2004-06-11 00:00:00",
			});
		});

		test("expect displaytimelowerbound is set for uncertain month component (YYYY-?MM-DD)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTime: "2004-?06-11" })
				.expect(200);

			const result = await db.query(
				"SELECT to_char(displaytimelowerbound, 'YYYY-MM-DD HH24:MI:SS') as displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({
				displaytimelowerbound: "2004-06-11 00:00:00",
			});
		});

		test("expect displaytimelowerbound is set for approximate day component (YYYY-MM-~DD)", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTime: "2004-06-~11" })
				.expect(200);

			const result = await db.query(
				"SELECT to_char(displaytimelowerbound, 'YYYY-MM-DD HH24:MI:SS') as displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({
				displaytimelowerbound: "2004-06-11 00:00:00",
			});
		});

		test("expect displaytimelowerbound is set for set of years ({YYYY,YYYY,YYYY..YYYY})", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTime: "{1667,1668,1670..1672}" })
				.expect(200);

			const result = await db.query(
				"SELECT to_char(displaytimelowerbound, 'YYYY-MM-DD HH24:MI:SS') as displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({
				displaytimelowerbound: "1667-01-01 00:00:00",
			});
		});

		test("expect displaytimelowerbound is set for list of years ([YYYY,YYYY,YYYY..YYYY])", async () => {
			await agent
				.patch("/api/v2/folder/1")
				.send({ displayTime: "[1667,1668,1670..1672]" })
				.expect(200);

			const result = await db.query(
				"SELECT to_char(displaytimelowerbound, 'YYYY-MM-DD HH24:MI:SS') as displaytimelowerbound FROM folder WHERE folderid = :folderId",
				{ folderId: 1 },
			);

			expect(result.rows[0]).toEqual({
				displaytimelowerbound: "1667-01-01 00:00:00",
			});
		});
	});
});
