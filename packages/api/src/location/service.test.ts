import { vi } from "vitest";
import { logger } from "@stela/logger";
import { db } from "../database";
import { insertLocation, updateLocation } from "./service";
import type { LocationInput } from "./models";

vi.mock("../database");
vi.mock("@stela/logger");

const baseLocation: LocationInput = { name: "Test" };

describe("insertLocation", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		vi.clearAllMocks();
	});

	test("expect 500 if the insert query fails", async () => {
		const testError = new Error("test error");
		vi.spyOn(db, "sql").mockImplementation(async () => {
			throw testError;
		});

		await expect(insertLocation(baseLocation)).rejects.toMatchObject({
			statusCode: 500,
		});
		expect(logger.error).toHaveBeenCalledWith(testError);
	});

	test("expect 500 if the insert returns no row", async () => {
		vi.spyOn(db, "sql").mockImplementation(
			vi.fn().mockResolvedValue({ rows: [] }),
		);

		await expect(insertLocation(baseLocation)).rejects.toMatchObject({
			statusCode: 500,
		});
	});

	test("expect a sublocation without a leading number to be stored entirely as streetName", async () => {
		const sqlSpy = vi
			.spyOn(db, "sql")
			.mockImplementation(
				vi.fn().mockResolvedValue({ rows: [{ locationId: "1" }] }),
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
		vi.restoreAllMocks();
		vi.clearAllMocks();
	});

	test("expect 500 if the update query fails", async () => {
		const testError = new Error("test error");
		vi.spyOn(db, "sql").mockImplementation(async () => {
			throw testError;
		});

		await expect(updateLocation("1", baseLocation)).rejects.toMatchObject({
			statusCode: 500,
		});
		expect(logger.error).toHaveBeenCalledWith(testError);
	});

	test("expect 404 if the update returns no row", async () => {
		vi.spyOn(db, "sql").mockImplementation(
			vi.fn().mockResolvedValue({ rows: [] }),
		);

		await expect(updateLocation("1", baseLocation)).rejects.toMatchObject({
			statusCode: 404,
		});
	});
});
