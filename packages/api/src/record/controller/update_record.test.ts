import { when } from "jest-when";
import { logger } from "@stela/logger";
import request from "supertest";
import { app } from "../../app";
import { db } from "../../database";
import { AccessRole } from "../../access/models";
import { mockVerifyUserAuthentication } from "../../../test/middleware_mocks";
import type { ArchiveRecord } from "../models";

jest.mock("../../database");
jest.mock("../../middleware");
jest.mock("@stela/logger");

const setupDatabase = async (): Promise<void> => {
	await db.sql("record.fixtures.create_test_accounts");
	await db.sql("record.fixtures.create_test_archives");
	await db.sql("record.fixtures.create_test_account_archives");
	await db.sql("record.fixtures.create_test_locations");
	await db.sql("record.fixtures.create_test_records");
	await db.sql("record.fixtures.create_complete_test_record");
	await db.sql("record.fixtures.create_test_folders");
	await db.sql("record.fixtures.create_test_folder_links");
	await db.sql("record.fixtures.create_test_accesses");
	await db.sql("record.fixtures.create_test_files");
	await db.sql("record.fixtures.create_complete_test_files");
	await db.sql("record.fixtures.create_test_record_files");
	await db.sql("record.fixtures.create_test_tags");
	await db.sql("record.fixtures.create_test_tag_links");
	await db.sql("record.fixtures.create_test_shares");
	await db.sql("record.fixtures.create_test_profile_items");
	await db.sql("record.fixtures.create_complete_test_folder_links");
	await db.sql("record.fixtures.create_test_shareby_urls");
	await db.sql("record.fixtures.create_test_invite_shares");
	await db.sql("record.fixtures.create_test_account_space");
	await db.sql("record.fixtures.create_test_archive_nbr");
};

const clearDatabase = async (): Promise<void> => {
	await db.query(
		`TRUNCATE
			account,
			archive,
			account_archive,
			record,
			folder,
			folder_link,
			locn,
			access,
			tag,
			tag_link,
			share,
			shareby_url,
			profile_item,
			invite,
			invite_share,
			archive_nbr,
			file CASCADE`,
	);
};

describe("PATCH /records", () => {
	const agent = request(app);

	beforeEach(async () => {
		mockVerifyUserAuthentication(
			"test@permanent.org",
			"b5461dc2-1eb0-450e-b710-fef7b2cafe1e",
		);
		await clearDatabase();
		await setupDatabase();
	});

	afterEach(async () => {
		await clearDatabase();
		jest.restoreAllMocks();
		jest.clearAllMocks();
	});

	test("expect an empty query to cause a 400 error", async () => {
		await agent.patch("/api/v2/records/10001").send({}).expect(400);
	});

	test("expect non existent record to cause a 404 error", async () => {
		await agent
			.patch("/api/v2/records/111111111")
			.send({ description: "aa" })
			.expect(404);
	});

	test("expect request to have an email from auth token if an auth token exists", async () => {
		mockVerifyUserAuthentication(
			"not an email",
			"06a4c1dd-bee6-4fee-bcd5-419d06b936d9",
		);
		await agent.patch("/api/v2/records/10001").expect(400);
	});

	test("expect location id is updated", async () => {
		await agent
			.patch("/api/v2/records/10001")
			.send({ locationId: 123 })
			.expect(200);

		const result = await db.query(
			`SELECT locnid AS "locationId" FROM record WHERE recordId = :recordId`,
			{
				recordId: 10001,
			},
		);

		expect(result.rows[0]).toEqual({ locationId: "123" });
	});

	test("expect location id is updated when set to null", async () => {
		await agent
			.patch("/api/v2/records/10008")
			.send({ locationId: null })
			.expect(200);

		const result = await db.query(
			`SELECT locnid AS "locationId" FROM record WHERE recordId = :recordId`,
			{
				recordId: 10008,
			},
		);

		expect(result.rows[0]).toStrictEqual({ locationId: null });
	});

	test("expect description is updated when set to null", async () => {
		await agent
			.patch("/api/v2/records/10008")
			.send({ description: null })
			.expect(200);

		const result = await db.query(
			"SELECT description FROM record WHERE recordId = :recordId",
			{
				recordId: 10008,
			},
		);

		expect(result.rows[0]).toStrictEqual({ description: null });
	});

	test("expect a success response to include the updated record", async () => {
		const response = await agent
			.patch("/api/v2/records/10008")
			.send({ description: "new description" })
			.expect(200);

		const {
			body: { data: record },
		} = response as { body: { data: ArchiveRecord } };
		expect(record.recordId).toStrictEqual("10008");
		expect(record.description).toStrictEqual("new description");
	});

	test("expect 400 error if location id is wrong type", async () => {
		await agent
			.patch("/api/v2/records/10001")
			.send({
				locationId: false,
			})
			.expect(400);
	});

	test("expect 400 error if display time is not valid Level 1 EDTF", async () => {
		await agent
			.patch("/api/v2/records/10001")
			.send({
				displayTime: "2001-34", // This is Level 2 EDTF for "Q2 of 2001"
			})
			.expect(400);
	});

	test("expect 400 error with detail if display time interval end is before start", async () => {
		const response = await agent
			.patch("/api/v2/records/1")
			.send({ displayTime: "2020/2019" })
			.expect(400);
		expect(response.text).toContain(
			"Interval start must be before or equal to end",
		);
	});

	test("expect display time is updated", async () => {
		await agent
			.patch("/api/v2/records/10001")
			.send({ displayTime: "2001-21~" })
			.expect(200);

		const result = await db.query(
			"SELECT originalfilecreationtime FROM record WHERE recordId = :recordId",
			{
				recordId: 10001,
			},
		);

		expect(result.rows[0]).toEqual({ originalfilecreationtime: "2001-21~" });
	});

	test("expect display time is updated when set to null", async () => {
		await agent
			.patch("/api/v2/records/10008")
			.send({ displayTime: null })
			.expect(200);

		const result = await db.query(
			"SELECT originalfilecreationtime FROM record WHERE recordId = :recordId",
			{
				recordId: 10008,
			},
		);

		expect(result.rows[0]).toEqual({ originalfilecreationtime: null });
	});

	test("expect to log error and return 500 if database permissions query fails", async () => {
		const testError = new Error("test error");
		jest.spyOn(db, "sql").mockImplementation(async () => {
			throw testError;
		});

		await agent
			.patch("/api/v2/records/10001")
			.send({ locationId: 123 })
			.expect(500);

		expect(logger.error).toHaveBeenCalledWith(testError);
	});

	test("expect to log error and return 500 if database update query fails", async () => {
		const testError = new Error("test error");
		const dbSpy = jest.spyOn(db, "sql");
		when(dbSpy)
			.calledWith("access.queries.get_record_access_role", {
				itemId: "10001",
				email: "test@permanent.org",
			})
			.mockImplementationOnce(
				jest.fn().mockResolvedValueOnce({
					rows: [
						{
							archiveAccessRole: AccessRole.Owner,
							shareAccessRole: undefined,
						},
					],
				}),
			)
			.calledWith("record.queries.update_record", {
				recordId: "10001",
				displayName: undefined,
				locationId: 123,
				setLocationIdToNull: false,
				description: undefined,
				setDescriptionToNull: false,
				displayTime: undefined,
				setDisplayTimeToNull: false,
			})
			.mockRejectedValueOnce(testError);

		await agent
			.patch("/api/v2/records/10001")
			.send({ locationId: 123 })
			.expect(500);

		expect(logger.error).toHaveBeenCalledWith(testError);
	});

	test("expect 403 forbidden response if user doesn't have access rights", async () => {
		mockVerifyUserAuthentication(
			"test+1@permanent.org",
			"b5461dc2-1eb0-450e-b710-fef7b2cafe1e",
		);
		await agent
			.patch("/api/v2/records/10001")
			.send({ locationId: 123 })
			.expect(403);
	});

	test("expect 404 not found response if user doesn't have access rights", async () => {
		mockVerifyUserAuthentication(
			"unknown@permanent.org",
			"b5461dc2-1eb0-450e-b710-fef7b2cafe1e",
		);
		await agent
			.patch("/api/v2/records/10001")
			.send({ locationId: 123 })
			.expect(404);
	});

	test("expect to return 404 if database update updates nothing", async () => {
		const dbSpy = jest.spyOn(db, "sql");
		when(dbSpy)
			.calledWith("access.queries.get_record_access_role", {
				itemId: "10001",
				email: "test@permanent.org",
			})
			.mockImplementationOnce(
				jest.fn().mockResolvedValueOnce({
					rows: [
						{
							archiveAccessRole: AccessRole.Owner,
							shareAccessRole: undefined,
						},
					],
				}),
			)
			.calledWith("record.queries.update_record", {
				recordId: "10001",
				displayName: undefined,
				locationId: 123,
				setLocationIdToNull: false,
				description: undefined,
				setDescriptionToNull: false,
				displayTime: undefined,
				setDisplayTimeToNull: false,
			})
			.mockImplementationOnce(
				jest.fn().mockResolvedValueOnce({
					rows: [],
				}),
			);

		await agent
			.patch("/api/v2/records/10001")
			.send({ locationId: 123 })
			.expect(404);
	});

	test("expect display name is updated", async () => {
		await agent
			.patch("/api/v2/records/10001")
			.send({ displayName: "New Name" })
			.expect(200);

		const result = await db.query(
			"SELECT displayname FROM record WHERE recordId = :recordId",
			{
				recordId: 10001,
			},
		);

		expect(result.rows[0]).toEqual({ displayname: "New Name" });
	});

	test("expect display name and description are updated together", async () => {
		await agent
			.patch("/api/v2/records/10001")
			.send({ displayName: "Updated Name", description: "Updated description" })
			.expect(200);

		const result = await db.query(
			"SELECT displayname, description FROM record WHERE recordId = :recordId",
			{
				recordId: 10001,
			},
		);

		expect(result.rows[0]).toEqual({
			displayname: "Updated Name",
			description: "Updated description",
		});
	});

	test("expect all fields are updated together", async () => {
		await agent
			.patch("/api/v2/records/10001")
			.send({
				displayName: "All Fields Name",
				description: "All fields description",
				locationId: 456,
			})
			.expect(200);

		const result = await db.query(
			`SELECT displayname, description, locnid AS "locationId" FROM record WHERE recordId = :recordId`,
			{
				recordId: 10001,
			},
		);

		expect(result.rows[0]).toEqual({
			displayname: "All Fields Name",
			description: "All fields description",
			locationId: "456",
		});
	});

	test("expect 400 error if display name is empty string", async () => {
		await agent
			.patch("/api/v2/records/10001")
			.send({
				displayName: "",
			})
			.expect(400);
	});

	test("expect 400 error if display name is null", async () => {
		await agent
			.patch("/api/v2/records/10001")
			.send({
				displayName: null,
			})
			.expect(400);
	});

	test("expect 400 error if display name is wrong type", async () => {
		await agent
			.patch("/api/v2/records/10001")
			.send({
				displayName: false,
			})
			.expect(400);
	});

	test("expect a nested location to update the existing location row", async () => {
		await agent
			.patch("/api/v2/records/10008")
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

		const recordResult = await db.query(
			`SELECT locnid AS "locationId" FROM record WHERE recordid = :recordId`,
			{ recordId: 10008 },
		);
		expect(recordResult.rows[0]).toEqual({ locationId: "1" });

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
			.patch("/api/v2/records/10008")
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

	test("expect a nested location to create a new location when record has none", async () => {
		await agent
			.patch("/api/v2/records/10001")
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

		const recordResult = await db.query<{ locationId: string }>(
			`SELECT locnid AS "locationId" FROM record WHERE recordid = :recordId`,
			{ recordId: 10001 },
		);
		const newLocationId = recordResult.rows[0]?.locationId;
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

	test("expect 400 error if location and locationId are both provided", async () => {
		await agent
			.patch("/api/v2/records/10001")
			.send({
				locationId: 1,
				location: { name: "Conflicting" },
			})
			.expect(400);
	});

	test("expect 400 error if location is an empty object", async () => {
		await agent
			.patch("/api/v2/records/10001")
			.send({ location: {} })
			.expect(400);
	});

	test("expect 404 if record disappears between access check and location lookup", async () => {
		const sqlSpy = jest.spyOn(db, "sql");
		when(sqlSpy)
			.calledWith("record.queries.get_record_location_id", {
				recordId: "10001",
			})
			.mockImplementationOnce(
				jest.fn().mockResolvedValue({
					rows: [],
				}),
			);

		await agent
			.patch("/api/v2/records/10001")
			.send({ location: { name: "Test" } })
			.expect(404);
	});

	test("expect 500 if the record location lookup query fails", async () => {
		const testError = new Error("test error");
		const sqlSpy = jest.spyOn(db, "sql");
		when(sqlSpy)
			.calledWith("record.queries.get_record_location_id", {
				recordId: "10001",
			})
			.mockImplementationOnce(jest.fn().mockRejectedValue(testError));

		await agent
			.patch("/api/v2/records/10001")
			.send({ location: { name: "Test" } })
			.expect(500);

		expect(logger.error).toHaveBeenCalledWith(testError);
	});
});
