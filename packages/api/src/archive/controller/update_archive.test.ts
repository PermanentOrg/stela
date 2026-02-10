import request from "supertest";
import { logger } from "@stela/logger";
import { app } from "../../app";
import { db } from "../../database";
import { mockVerifyUserAuthentication } from "../../../test/middleware_mocks";
import type { Archive } from "../models";

jest.mock("../../database");
jest.mock("../../middleware");
jest.mock("@stela/logger");

const loadFixtures = async (): Promise<void> => {
	await db.sql("archive.fixtures.create_test_accounts");
	await db.sql("archive.fixtures.create_test_archives");
	await db.sql("archive.fixtures.create_test_account_archives");
	await db.sql("archive.fixtures.create_test_profile_items");
	await db.sql("archive.fixtures.create_test_text_data");
	await db.sql("archive.fixtures.create_test_folders");
};

const clearDatabase = async (): Promise<void> => {
	await db.query(
		"TRUNCATE account, archive, account_archive, profile_item, text_data, folder CASCADE",
	);
};

describe("PATCH /archive/:archiveId", () => {
	const agent = request(app);
	beforeEach(async () => {
		mockVerifyUserAuthentication(
			"test@permanent.org",
			"82bd483e-914b-4bfe-abf9-92ffe86d7803",
		);
		await loadFixtures();
	});

	afterEach(async () => {
		await clearDatabase();
	});

	test("should update archive with chronological milestone sort order", async () => {
		const archiveId = "1";

		const response = await agent
			.patch(`/api/v2/archive/${archiveId}`)
			.send({ milestoneSortOrder: "chronological" })
			.expect(200);

		const {
			body: { data: archive },
		} = response as { body: { data: Archive } };
		expect(archive).toBeDefined();
		expect(archive.archiveId).toBe(archiveId);
		expect(archive.milestoneSortOrder).toBe("chronological");
	});

	test("should update archive with reverse_chronological milestone sort order", async () => {
		const archiveId = "1";

		const response = await agent
			.patch(`/api/v2/archive/${archiveId}`)
			.send({ milestoneSortOrder: "reverse_chronological" })
			.expect(200);

		const {
			body: { data: archive },
		} = response as { body: { data: Archive } };
		expect(archive).toBeDefined();
		expect(archive.archiveId).toBe(archiveId);
		expect(archive.milestoneSortOrder).toBe("reverse_chronological");
	});

	test("should return 400 if milestoneSortOrder is missing", async () => {
		const archiveId = "1";

		await agent.patch(`/api/v2/archive/${archiveId}`).send({}).expect(400);
	});

	test("should return 400 if milestoneSortOrder has invalid value", async () => {
		const archiveId = "1";

		await agent
			.patch(`/api/v2/archive/${archiveId}`)
			.send({ milestoneSortOrder: "invalid_value" })
			.expect(400);
	});

	test("should return 404 if archive doesn't exist", async () => {
		const archiveId = "1000000";

		await agent
			.patch(`/api/v2/archive/${archiveId}`)
			.send({ milestoneSortOrder: "chronological" })
			.expect(404);
	});

	test("should return 404 if user does not have permission to update archive", async () => {
		mockVerifyUserAuthentication(
			"unauthorized@example.com",
			"aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
		);
		const archiveId = "1";

		await agent
			.patch(`/api/v2/archive/${archiveId}`)
			.send({ milestoneSortOrder: "chronological" })
			.expect(404);
	});

	test("should throw an InternalServerError if database query fails", async () => {
		const archiveId = "1";
		const testError = new Error("error: out of cheese - redo from start");
		jest.spyOn(db, "sql").mockRejectedValueOnce(testError);

		await agent
			.patch(`/api/v2/archive/${archiveId}`)
			.send({ milestoneSortOrder: "chronological" })
			.expect(500);

		expect(logger.error).toHaveBeenCalledWith(testError);
	});
});
