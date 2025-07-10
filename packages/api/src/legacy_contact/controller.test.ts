import request from "supertest";
import { logger } from "@stela/logger";
import { app } from "../app";
import { db } from "../database";
import { sendLegacyContactNotification } from "../email";
import type { LegacyContact } from "./model";
import { mockVerifyUserAuthentication } from "../../test/middleware_mocks";

jest.mock("@stela/logger");
jest.mock("../database");
jest.mock("../middleware");
jest.mock("../email", () => ({
	sendLegacyContactNotification: jest.fn(),
}));

describe("GET /legacy-contact", () => {
	const loadFixtures = async (): Promise<void> => {
		await db.sql("legacy_contact.fixtures.create_test_accounts");
		await db.sql("legacy_contact.fixtures.create_test_legacy_contacts");
	};

	const clearDatabase = async (): Promise<void> => {
		await db.query("TRUNCATE account, legacy_contact CASCADE");
	};

	beforeEach(async () => {
		mockVerifyUserAuthentication(
			"test@permanent.org",
			"88420040-ec8d-4bc8-88f8-defaa74a05a5",
		);

		await clearDatabase();
		await loadFixtures();
	});
	afterEach(async () => {
		await clearDatabase();
	});

	const agent = request(app);

	test("should return an array of legacy contacts for a valid accountId", async () => {
		const result = await agent.get("/api/v2/legacy-contact/").expect(200);

		const { body: resultBody } = result as { body: LegacyContact[] };
		expect(resultBody.length).toEqual(1);
		expect(resultBody[0]?.name).toEqual("John Rando");
		expect(resultBody[0]?.email).toEqual("contact@permanent.org");
	});

	test("should throw an InternalServerError when retrieval of legacy contacts fails", async () => {
		const testError = new Error("Out of cheese error - redo from start");
		jest.spyOn(db, "sql").mockImplementationOnce(async () => {
			throw testError;
		});
		await agent.get("/api/v2/legacy-contact/").expect(500);

		expect(logger.error).toHaveBeenCalledWith(testError);
	});

	test("should throw a 400 error if the request validation fails", async () => {
		mockVerifyUserAuthentication();

		await agent.get("/api/v2/legacy-contact/").expect(400);
	});
});

describe("POST /legacy-contact", () => {
	const agent = request(app);

	const loadFixtures = async (): Promise<void> => {
		await db.sql("legacy_contact.fixtures.create_test_accounts");
	};

	const clearDatabase = async (): Promise<void> => {
		await db.query("TRUNCATE account, legacy_contact CASCADE");
	};

	beforeEach(async () => {
		mockVerifyUserAuthentication(
			"test@permanent.org",
			"88420040-ec8d-4bc8-88f8-defaa74a05a5",
		);

		await clearDatabase();
		await loadFixtures();
	});
	afterEach(async () => {
		await clearDatabase();
		jest.clearAllMocks();
	});

	test("should successfully create a legacy contact", async () => {
		jest.mocked(sendLegacyContactNotification).mockResolvedValueOnce(undefined);
		await agent
			.post("/api/v2/legacy-contact/")
			.send({
				name: "Legacy Contact",
				email: "legacy.contact@permanent.org",
			})
			.expect(200);

		const legacyContactResult = await db.query<LegacyContact>(
			`SELECT
        legacy_contact_id "legacyContactId",
        account_id "accountId",
        name,
        email,
        created_dt "createdDt",
        updated_dt "updatedDt"
      FROM
        legacy_contact
      WHERE
        account_id = :accountId`,
			{ accountId: 2 },
		);
		expect(legacyContactResult.rows.length).toBe(1);
		expect(sendLegacyContactNotification).toHaveBeenCalledWith(
			legacyContactResult.rows[0]?.legacyContactId,
		);
	});

	test("should log errors sending email", async () => {
		const testError = new Error("out of cheese error - redo from start");
		jest.mocked(sendLegacyContactNotification).mockRejectedValueOnce(testError);
		await agent
			.post("/api/v2/legacy-contact")
			.send({
				name: "Legacy Contact",
				email: "legacy.contact@permanent.org",
			})
			.expect(200);

		expect(logger.error).toHaveBeenCalledWith(testError);
	});

	test("should error if emailFromAuthToken doesn't correspond to an account", async () => {
		mockVerifyUserAuthentication(
			"not_an_account@permanent.org",
			"88420040-ec8d-4bc8-88f8-defaa74a05a5",
		);
		await agent
			.post("/api/v2/legacy-contact/")
			.send({
				name: "Legacy Contact",
				email: "legacy.contact@permanent.org",
			})
			.expect(500);
	});

	test("should error if legacy contact can't be created", async () => {
		jest
			.spyOn(db, "sql")
			.mockImplementationOnce(jest.fn().mockResolvedValue({ rows: [] }));
		await agent
			.post("/api/v2/legacy-contact")
			.send({
				name: "Legacy Contact",
				email: "legacy.contact@permanent.org",
			})
			.expect(500);
	});

	test("should respond with 400 if the request is invalid", async () => {
		await agent.post("/api/v2/legacy-contact").send({}).expect(400);
	});
});

describe("PUT /legacy-contact/:legacyContactId", () => {
	const agent = request(app);

	const loadFixtures = async (): Promise<void> => {
		await db.sql("legacy_contact.fixtures.create_test_accounts");
		await db.sql("legacy_contact.fixtures.create_test_legacy_contacts");
	};

	const clearDatabase = async (): Promise<void> => {
		await db.query("TRUNCATE account, legacy_contact CASCADE");
	};

	const testLegacyContactId = "0cb0738c-5607-42d0-8014-8666a8d6ba13";

	beforeEach(async () => {
		mockVerifyUserAuthentication(
			"test@permanent.org",
			"88420040-ec8d-4bc8-88f8-defaa74a05a5",
		);
		await clearDatabase();
		await loadFixtures();
	});
	afterEach(async () => {
		await clearDatabase();
		jest.clearAllMocks();
	});

	test("should update a legacy contact's name and email", async () => {
		jest.mocked(sendLegacyContactNotification).mockResolvedValueOnce(undefined);
		const result = await agent
			.put(`/api/v2/legacy-contact/${testLegacyContactId}`)
			.send({
				name: "Jane Rando",
				email: "contact+1@permanent.org",
			})
			.expect(200);
		const { body: resultBody } = result as { body: LegacyContact };
		expect(resultBody.name).toEqual("Jane Rando");
		expect(resultBody.email).toEqual("contact+1@permanent.org");

		const legacyContactResult = await db.query<LegacyContact>(
			`SELECT
        legacy_contact_id "legacyContactId",
        account_id "accountId",
        name,
        email,
        created_dt "createdDt",
        updated_dt "updatedDt"
      FROM
        legacy_contact
      WHERE
        legacy_contact_id = :legacyContactId`,
			{ legacyContactId: testLegacyContactId },
		);
		expect(legacyContactResult.rows.length).toBe(1);
		expect(legacyContactResult.rows[0]?.name).toBe("Jane Rando");
		expect(legacyContactResult.rows[0]?.email).toBe("contact+1@permanent.org");
		expect(sendLegacyContactNotification).toHaveBeenCalledWith(
			testLegacyContactId,
		);
	});

	test("should update a legacy contact's name and not email", async () => {
		const result = await agent
			.put(`/api/v2/legacy-contact/${testLegacyContactId}`)
			.send({
				name: "Jane Rando",
			});
		const { body: resultBody } = result as { body: LegacyContact };
		expect(resultBody.name).toEqual("Jane Rando");
		expect(resultBody.email).toEqual("contact@permanent.org");

		const legacyContactResult = await db.query<LegacyContact>(
			`SELECT
        legacy_contact_id "legacyContactId",
        account_id "accountId",
        name,
        email,
        created_dt "createdDt",
        updated_dt "updatedDt"
      FROM
        legacy_contact
      WHERE
        legacy_contact_id = :legacyContactId`,
			{ legacyContactId: testLegacyContactId },
		);
		expect(legacyContactResult.rows.length).toBe(1);
		expect(legacyContactResult.rows[0]?.name).toBe("Jane Rando");
		expect(legacyContactResult.rows[0]?.email).toBe("contact@permanent.org");
		expect(sendLegacyContactNotification).toHaveBeenCalledTimes(0);
	});

	test("should raise not found error when legacy contact does not exist for account", async () => {
		mockVerifyUserAuthentication(
			"test+1@permanent.org",
			"88420040-ec8d-4bc8-88f8-defaa74a05a5",
		);
		await agent
			.put(`/api/v2/legacy-contact/${testLegacyContactId}`)
			.send({
				name: "Jane Rando",
			})
			.expect(404);
	});

	test("should throw an InternalServerError when update fails unexpectedly", async () => {
		jest.spyOn(db, "sql").mockImplementationOnce(async () => {
			throw new Error("Out of cheese error - redo from start");
		});
		await agent
			.put(`/api/v2/legacy-contact/${testLegacyContactId}`)
			.send({
				name: "Jane Rando",
			})
			.expect(500);
	});

	test("should log errors sending email", async () => {
		const testError = new Error("out of cheese error - redo from start");
		jest.mocked(sendLegacyContactNotification).mockRejectedValueOnce(testError);
		await agent
			.put(`/api/v2/legacy-contact/${testLegacyContactId}`)
			.send({
				name: "Jane Rando",
				email: "contact+1@permanent.org",
			})
			.expect(200);
		expect(logger.error).toHaveBeenCalledWith(testError);
	});

	test("should respond with 400 if the request is invalid", async () => {
		await agent
			.put(`/api/v2/legacy-contact/${testLegacyContactId}`)
			.send({
				email: "not_an_email",
			})
			.expect(400);
	});
});
