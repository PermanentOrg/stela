import { logger } from "@stela/logger";
import { db } from "../database";
import { insertLocation, updateLocation } from "./service";
import type { LocationInput } from "./models";

jest.mock("../database");
jest.mock("@stela/logger");

const baseLocation: LocationInput = { name: "Test" };

describe("insertLocation", () => {
	afterEach(() => {
		jest.restoreAllMocks();
		jest.clearAllMocks();
	});

	test("expect 500 if the insert query fails", async () => {
		const testError = new Error("test error");
		jest.spyOn(db, "sql").mockImplementation(async () => {
			throw testError;
		});

		await expect(insertLocation(baseLocation)).rejects.toMatchObject({
			statusCode: 500,
		});
		expect(logger.error).toHaveBeenCalledWith(testError);
	});

	test("expect 500 if the insert returns no row", async () => {
		jest
			.spyOn(db, "sql")
			.mockImplementation(jest.fn().mockResolvedValue({ rows: [] }));

		await expect(insertLocation(baseLocation)).rejects.toMatchObject({
			statusCode: 500,
		});
	});

	test("expect a sublocation without a leading number to be stored entirely as streetName", async () => {
		const sqlSpy = jest
			.spyOn(db, "sql")
			.mockImplementation(
				jest.fn().mockResolvedValue({ rows: [{ locationId: "1" }] }),
			);

		await insertLocation({ name: "Test", sublocation: "Main Street" });

		expect(sqlSpy).toHaveBeenCalledWith(
			"location.queries.insert_location",
			expect.objectContaining({
				streetNumber: null,
				streetName: "Main Street",
			}),
		);
	});
});

describe("updateLocation", () => {
	afterEach(() => {
		jest.restoreAllMocks();
		jest.clearAllMocks();
	});

	test("expect 500 if the update query fails", async () => {
		const testError = new Error("test error");
		jest.spyOn(db, "sql").mockImplementation(async () => {
			throw testError;
		});

		await expect(updateLocation("1", baseLocation)).rejects.toMatchObject({
			statusCode: 500,
		});
		expect(logger.error).toHaveBeenCalledWith(testError);
	});

	test("expect 404 if the update returns no row", async () => {
		jest
			.spyOn(db, "sql")
			.mockImplementation(jest.fn().mockResolvedValue({ rows: [] }));

		await expect(updateLocation("1", baseLocation)).rejects.toMatchObject({
			statusCode: 404,
		});
	});
});
