import request from "supertest";
import type { NextFunction } from "express";
import createError from "http-errors";
import { db } from "../database";
import { mixpanelClient } from "../mixpanel";
import { publisherClient } from "../publisher_client";
import { app } from "../app";
import {
	verifyUserAuthentication,
	verifyUserOrAdminAuthentication,
} from "../middleware";
import type { ChecklistItem } from "./models";
import {
	mockVerifyUserOrAdminAuthentication,
	mockVerifyUserAuthentication,
	mockExtractIp,
} from "../../test/middleware_mocks";

jest.mock("../database");
jest.mock("../middleware");
jest.mock("../mixpanel");
jest.mock("../publisher_client");

const testSubject = "fcb2b59b-df07-4e79-ad20-bf7f067a965e";
const testEmail = "test+1@permanent.org";
const testNoProgressEmail = "test+no_progress@permanent.org";
const testIp = "192.168.0.1";

describe("POST /event", () => {
	const agent = request(app);

	const clearDatabase = async (): Promise<void> => {
		await db.query("TRUNCATE event CASCADE");
	};

	beforeEach(async () => {
		mockVerifyUserOrAdminAuthentication(
			testEmail,
			testSubject,
			undefined,
			undefined,
		);
		mockExtractIp(testIp);
	});

	afterEach(async () => {
		await clearDatabase();
		jest.restoreAllMocks();
		jest.clearAllMocks();
	});

	test("should return 401 if unauthenticated", async () => {
		jest
			.mocked(verifyUserOrAdminAuthentication)
			.mockImplementation(async (_, __, next: NextFunction) => {
				next(new createError.Unauthorized("You aren't logged in"));
			});
		await agent.post("/api/v2/event").expect(401);
	});

	test("should have actorType user if authenticated as user", async () => {
		await agent
			.post("/api/v2/event")
			.send({
				entity: "account",
				action: "create",
				version: 1,
				entityId: "123",
				body: {},
			})
			.expect(200);

		const result = await db.query<{ actorType: string }>(
			'SELECT actor_type AS "actorType" FROM event WHERE actor_id = :actorId',
			{
				actorId: testSubject,
			},
		);

		expect(result.rows).toHaveLength(1);
		expect(result.rows[0]?.actorType).toBe("user");
	});

	test("should record actor type admin if authenticated as an admin", async () => {
		mockVerifyUserOrAdminAuthentication(
			undefined,
			undefined,
			testEmail,
			testSubject,
		);
		await agent
			.post("/api/v2/event")
			.send({
				entity: "account",
				action: "create",
				version: 1,
				entityId: "123",
				body: {},
			})
			.expect(200);

		const result = await db.query<{ actorType: string }>(
			'SELECT actor_type AS "actorType" FROM event WHERE actor_id = :actorId',
			{
				actorId: testSubject,
			},
		);

		expect(result.rows).toHaveLength(1);
		expect(result.rows[0]?.actorType).toBe("admin");
	});

	test("should return 400 if fields from auth token fail validation", async () => {
		jest
			.mocked(verifyUserOrAdminAuthentication)
			.mockImplementation(async (_, __, next: NextFunction) => {
				next();
			});
		await agent.post("/api/v2/event").expect(400);
	});

	test("should return 400 if entity is missing", async () => {
		await agent
			.post("/api/v2/event")
			.send({ action: "create", version: 1, entityId: "123", body: {} })
			.expect(400);
	});

	test("should return 400 if entity is not a string", async () => {
		await agent
			.post("/api/v2/event")
			.send({
				entity: 1,
				action: "create",
				version: 1,
				entityId: "123",
				body: {},
			})
			.expect(400);
	});

	test("should return 400 if action is missing", async () => {
		await agent
			.post("/api/v2/event")
			.send({ entity: "account", version: 1, entityId: "123", body: {} })
			.expect(400);
	});

	test("should return 400 if action is not a string", async () => {
		await agent
			.post("/api/v2/event")
			.send({
				entity: "account",
				action: 1,
				version: 1,
				entityId: "123",
				body: {},
			})
			.expect(400);
	});

	test("should return 400 if version is missing", async () => {
		await agent
			.post("/api/v2/event")
			.send({ entity: "account", action: "create", entityId: "123", body: {} })
			.expect(400);
	});

	test("should return 400 if version is not a number", async () => {
		await agent
			.post("/api/v2/event")
			.send({
				entity: "account",
				action: "create",
				version: "not_a_number",
				entityId: "123",
				body: {},
			})
			.expect(400);
	});

	test("should return 400 if entityId is missing", async () => {
		await agent
			.post("/api/v2/event")
			.send({ entity: "account", action: "create", version: 1, body: {} })
			.expect(400);
	});

	test("should return 400 if entityId is not a string", async () => {
		await agent
			.post("/api/v2/event")
			.send({
				entity: "account",
				action: "create",
				version: 1,
				entityId: 123,
				body: {},
			})
			.expect(400);
	});

	test("should return 400 if ip is not an ip", async () => {
		mockExtractIp("not_an_ip");
		await agent
			.post("/api/v2/event")
			.send({
				entity: "account",
				action: "create",
				version: 1,
				entityId: "123",
				body: {},
			})
			.expect(400);
	});

	test("should return 400 if userAgent is not a string", async () => {
		await agent
			.post("/api/v2/event")
			.send({
				entity: "account",
				action: "create",
				version: 1,
				entityId: "123",
				userAgent: 1,
				body: {},
			})
			.expect(400);
	});

	test("should return 400 if body is missing", async () => {
		await agent
			.post("/api/v2/event")
			.send({
				entity: "account",
				action: "create",
				version: 1,
				entityId: "123",
			})
			.expect(400);
	});

	test("should return 400 if body is not an object", async () => {
		await agent
			.post("/api/v2/event")
			.send({
				entity: "account",
				action: "create",
				version: 1,
				entityId: "123",
				body: "not_an_object",
			})
			.expect(400);
	});

	test("should return 400 if body includes analytics object with no event", async () => {
		await agent
			.post("/api/v2/event")
			.send({
				entity: "account",
				action: "create",
				version: 1,
				entityId: "123",
				body: {
					analytics: { data: {}, distinctId: "local:123" },
				},
			})
			.expect(400);
	});

	test("should return 400 if body includes analytics object with non-string event", async () => {
		await agent
			.post("/api/v2/event")
			.send({
				entity: "account",
				action: "create",
				version: 1,
				entityId: "123",
				body: {
					analytics: { event: 1, data: {}, distinctId: "local:123" },
				},
			})
			.expect(400);
	});

	test("should return 400 if body includes analytics object with no data", async () => {
		await agent
			.post("/api/v2/event")
			.send({
				entity: "account",
				action: "create",
				version: 1,
				entityId: "123",
				body: {
					analytics: { event: "test", distinctId: "local:123" },
				},
			})
			.expect(400);
	});

	test("should return 400 if body includes analytics object with non-object data", async () => {
		await agent
			.post("/api/v2/event")
			.send({
				entity: "account",
				action: "create",
				version: 1,
				entityId: "123",
				body: {
					analytics: {
						event: "test",
						distinctId: "local:123",
						data: "not_an_object",
					},
				},
			})
			.expect(400);
	});

	test("should return 400 if body includes analytics object missing distinctId", async () => {
		await agent
			.post("/api/v2/event")
			.send({
				entity: "account",
				action: "create",
				version: 1,
				entityId: "123",
				body: {
					analytics: { event: "test", data: {} },
				},
			})
			.expect(400);
	});

	test("should return 400 if body includes analytics object and distinctId not a string", async () => {
		await agent
			.post("/api/v2/event")
			.send({
				entity: "account",
				action: "create",
				version: 1,
				entityId: "123",
				body: {
					analytics: { event: "test", data: {}, distinct_id: 1 },
				},
			})
			.expect(400);
	});

	test("should record the event in the database", async () => {
		await agent
			.post("/api/v2/event")
			.send({
				entity: "account",
				action: "create",
				version: 1,
				entityId: "123",
				body: {},
			})
			.expect(200);

		const result = await db.query(
			"SELECT id FROM event WHERE actor_id = :actorId",
			{
				actorId: testSubject,
			},
		);

		expect(result.rows).toHaveLength(1);
	});

	test("should forward the event to SNS", async () => {
		await agent
			.post("/api/v2/event")
			.send({
				entity: "account",
				action: "create",
				version: 1,
				entityId: "123",
				body: {},
			})
			.expect(200);

		expect(publisherClient.publishMessage).toHaveBeenCalled();
	});

	test("should send Mixpanel event if body includes analytics", async () => {
		await agent
			.post("/api/v2/event")
			.set(
				"User-Agent",
				"Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/125.0.6422.33 Mobile/15E148 Safari/604.1",
			)
			.send({
				entity: "account",
				action: "create",
				version: 1,
				entityId: "123",
				body: {
					analytics: {
						event: "Sign Up",
						distinctId: "local:123",
						data: {
							accountId: "123",
							email: "test+sign_up@permanent.org",
						},
					},
				},
			})
			.expect(200);

		expect(mixpanelClient.track).toHaveBeenCalledWith("Sign Up", {
			distinct_id: "local:123",
			accountId: "123",
			email: "test+sign_up@permanent.org",
			$email: "test+1@permanent.org",
			$browser: "Mobile Chrome",
			$device: "mobile",
			$os: "iOS",
			ip: testIp,
		});
	});

	test("should send pass the caller email to Mixpanel when the caller is an admin", async () => {
		mockVerifyUserOrAdminAuthentication(
			undefined,
			undefined,
			testEmail,
			testSubject,
		);
		await agent
			.post("/api/v2/event")
			.set(
				"User-Agent",
				"Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/125.0.6422.33 Mobile/15E148 Safari/604.1",
			)
			.send({
				entity: "account",
				action: "update",
				version: 1,
				entityId: "123",
				body: {
					analytics: {
						event: "Account Frozen",
						distinctId: "local:123",
						data: {
							accountId: "123",
						},
					},
				},
			})
			.expect(200);

		expect(mixpanelClient.track).toHaveBeenCalledWith("Account Frozen", {
			distinct_id: "local:123",
			accountId: "123",
			$email: "test+1@permanent.org",
			$browser: "Mobile Chrome",
			$device: "mobile",
			$os: "iOS",
			ip: testIp,
		});
	});

	test("should return 500 error if Mixpanel call fails", async () => {
		jest.mocked(mixpanelClient.track).mockImplementation(() => {
			throw new Error("Mixpanel error");
		});
		await agent
			.post("/api/v2/event")
			.send({
				entity: "account",
				action: "create",
				version: 1,
				entityId: "123",
				body: {
					analytics: {
						event: "Sign Up",
						distinctId: "local:123",
						data: {
							accountId: "123",
							email: "test+sign_up@permanent.org",
						},
					},
				},
			})
			.expect(500);
	});

	test("should return 500 error if database call fails", async () => {
		jest.spyOn(db, "sql").mockImplementation(() => {
			throw new Error("SQL error");
		});
		await agent
			.post("/api/v2/event")
			.send({
				entity: "account",
				action: "create",
				version: 1,
				entityId: "123",
				body: {},
			})
			.expect(500);
	});

	test("should return 500 error if database call returns an empty result", async () => {
		jest.spyOn(db, "sql").mockImplementation(
			jest.fn().mockResolvedValue({
				rows: [],
			}),
		);
		await agent
			.post("/api/v2/event")
			.send({
				entity: "account",
				action: "create",
				version: 1,
				entityId: "123",
				body: {},
			})
			.expect(500);
	});

	test("should return 500 error if SNS publish fails", async () => {
		jest.spyOn(publisherClient, "publishMessage").mockImplementation(() => {
			throw new Error("SNS error");
		});
		await agent
			.post("/api/v2/event")
			.send({
				entity: "account",
				action: "create",
				version: 1,
				entityId: "123",
				body: {},
			})
			.expect(500);
	});

	test("should return 400 error if entity value is invalid", async () => {
		await agent
			.post("/api/v2/event")
			.send({
				entity: "not_an_entity",
				action: "create",
				version: 1,
				entityId: "123",
				body: {},
			})
			.expect(400);
	});

	test("should return 400 error if action value is invalid", async () => {
		await agent
			.post("/api/v2/event")
			.send({
				entity: "account",
				action: "not_an_action",
				version: 1,
				entityId: "123",
				body: {},
			})
			.expect(400);
	});
});

describe("GET /event/checklist", () => {
	const agent = request(app);

	const isChecklistItem = (value: object): value is ChecklistItem =>
		"id" in value &&
		"title" in value &&
		"completed" in value &&
		typeof value.id === "string" &&
		typeof value.title === "string" &&
		typeof value.completed === "boolean";

	const getChecklistItem = (
		responseBody: unknown,
		itemId: string,
	): ChecklistItem | undefined => {
		if (
			typeof responseBody !== "object" ||
			responseBody === null ||
			!("checklistItems" in responseBody) ||
			!Array.isArray(responseBody.checklistItems)
		) {
			return undefined;
		}

		const item = responseBody.checklistItems.find(
			(item: unknown) =>
				typeof item === "object" &&
				item !== null &&
				"id" in item &&
				item.id === itemId,
		) as unknown;

		if (typeof item !== "object" || item === null || !isChecklistItem(item)) {
			return undefined;
		}

		return item;
	};

	const loadFixtures = async (): Promise<void> => {
		await db.sql("event.fixtures.create_test_accounts");
		await db.sql("event.fixtures.create_test_events");
	};

	const clearDatabase = async (): Promise<void> => {
		await db.query("TRUNCATE account, event CASCADE");
	};

	beforeEach(async () => {
		mockVerifyUserAuthentication(testEmail, testSubject);
		await clearDatabase();
		await loadFixtures();
	});

	afterEach(async () => {
		jest.restoreAllMocks();
		jest.clearAllMocks();
		await clearDatabase();
	});

	test("should return 200 if authenticated", async () => {
		await agent.get("/api/v2/event/checklist").expect(200);
	});

	test("should return 401 if unauthenticated", async () => {
		jest
			.mocked(verifyUserAuthentication)
			.mockImplementation(async (_, __, next: NextFunction) => {
				next(new createError.Unauthorized("You aren't logged in"));
			});

		await agent.get("/api/v2/event/checklist").expect(401);
	});

	test("should return 400 if emailFromAuthToken is not an email", async () => {
		mockVerifyUserAuthentication("not_an_email", testSubject);

		await agent.get("/api/v2/event/checklist").expect(400);
	});

	test("should have the right title for each item", async () => {
		const response = await agent.get("/api/v2/event/checklist").expect(200);
		const responseBody = response.body as unknown;

		const archiveCreatedItem = getChecklistItem(responseBody, "archiveCreated");
		expect(archiveCreatedItem?.title).toEqual("Create your first archive");

		const storageRedeemedItem = getChecklistItem(
			responseBody,
			"storageRedeemed",
		);
		expect(storageRedeemedItem?.title).toEqual("Redeem free storage");

		const legacyContactItem = getChecklistItem(responseBody, "legacyContact");
		expect(legacyContactItem?.title).toEqual("Assign a Legacy Contact");

		const archiveStewardItem = getChecklistItem(responseBody, "archiveSteward");
		expect(archiveStewardItem?.title).toEqual("Assign an Archive Steward");

		const archiveProfileItem = getChecklistItem(responseBody, "archiveProfile");
		expect(archiveProfileItem?.title).toEqual("Update Archive Profile");

		const firstUploadItem = getChecklistItem(responseBody, "firstUpload");
		expect(firstUploadItem?.title).toEqual("Upload first file");

		const publishContentItem = getChecklistItem(responseBody, "publishContent");
		expect(publishContentItem?.title).toEqual("Publish your archive");
	});

	test("should communicate that a user with an archive has created an archive", async () => {
		const response = await agent.get("/api/v2/event/checklist").expect(200);
		const item = getChecklistItem(response.body as unknown, "archiveCreated");
		expect(item?.completed).toBe(true);
	});

	test("should communicate that a user without an archive has not created an archive", async () => {
		mockVerifyUserAuthentication(testNoProgressEmail, testSubject);
		const response = await agent.get("/api/v2/event/checklist").expect(200);
		const item = getChecklistItem(response.body as unknown, "archiveCreated");
		expect(item?.completed).toBe(false);
	});

	test("should communicate that a user has redeemed their welcome storage", async () => {
		const response = await agent.get("/api/v2/event/checklist").expect(200);
		const item = getChecklistItem(response.body as unknown, "storageRedeemed");
		expect(item?.completed).toBe(true);
	});

	test("should communicate that a user hasn't redeemed their welcome storage", async () => {
		mockVerifyUserAuthentication(testNoProgressEmail, testSubject);
		const response = await agent.get("/api/v2/event/checklist").expect(200);
		const item = getChecklistItem(response.body as unknown, "storageRedeemed");
		expect(item?.completed).toBe(false);
	});

	test("should communicate that a user has assigned a legacy contact", async () => {
		const response = await agent.get("/api/v2/event/checklist").expect(200);
		const item = getChecklistItem(response.body as unknown, "legacyContact");
		expect(item?.completed).toBe(true);
	});

	test("should communicate that a user hasn't assigned a legacy contact", async () => {
		mockVerifyUserAuthentication(testNoProgressEmail, testSubject);
		const response = await agent.get("/api/v2/event/checklist").expect(200);
		const item = getChecklistItem(response.body as unknown, "legacyContact");
		expect(item?.completed).toBe(false);
	});

	test("should communicate that a user has assigned an archive steward", async () => {
		const response = await agent.get("/api/v2/event/checklist").expect(200);
		const item = getChecklistItem(response.body as unknown, "archiveSteward");
		expect(item?.completed).toBe(true);
	});

	test("should communicate that a user hasn't assigned an archive steward", async () => {
		mockVerifyUserAuthentication(testNoProgressEmail, testSubject);
		const response = await agent.get("/api/v2/event/checklist").expect(200);
		const item = getChecklistItem(response.body as unknown, "archiveSteward");
		expect(item?.completed).toBe(false);
	});

	test("should communicate that a user has updated an archive profile", async () => {
		const response = await agent.get("/api/v2/event/checklist").expect(200);
		const item = getChecklistItem(response.body as unknown, "archiveProfile");
		expect(item?.completed).toBe(true);
	});

	test("should communicate that a user hasn't updated an archive profile", async () => {
		mockVerifyUserAuthentication(testNoProgressEmail, testSubject);
		const response = await agent.get("/api/v2/event/checklist").expect(200);
		const item = getChecklistItem(response.body as unknown, "archiveProfile");
		expect(item?.completed).toBe(false);
	});

	test("should communicate that a user has uploaded a file", async () => {
		const response = await agent.get("/api/v2/event/checklist").expect(200);
		const item = getChecklistItem(response.body as unknown, "firstUpload");
		expect(item?.completed).toBe(true);
	});

	test("should communicate that a user hasn't uploaded a file", async () => {
		mockVerifyUserAuthentication(testNoProgressEmail, testSubject);
		const response = await agent.get("/api/v2/event/checklist").expect(200);
		const item = getChecklistItem(response.body as unknown, "firstUpload");
		expect(item?.completed).toBe(false);
	});

	test("should communicate that a user has published content", async () => {
		const response = await agent.get("/api/v2/event/checklist").expect(200);
		const item = getChecklistItem(response.body as unknown, "publishContent");
		expect(item?.completed).toBe(true);
	});

	test("should communicate that a user has published content when they're uploaded directly to public workspace", async () => {
		mockVerifyUserAuthentication(
			"test@permanent.org",
			"5862a229-5ea0-4432-b29e-7f069e99558a",
		);
		const response = await agent.get("/api/v2/event/checklist").expect(200);
		const item = getChecklistItem(response.body as unknown, "publishContent");
		expect(item?.completed).toBe(true);
	});

	test("should communicate that a user hasn't published content", async () => {
		mockVerifyUserAuthentication(testNoProgressEmail, testSubject);
		const response = await agent.get("/api/v2/event/checklist").expect(200);
		const item = getChecklistItem(response.body as unknown, "publishContent");
		expect(item?.completed).toBe(false);
	});

	test("should return 500 error if database call fails", async () => {
		jest.spyOn(db, "sql").mockImplementation(() => {
			throw new Error("SQL error");
		});
		await agent.get("/api/v2/event/checklist").expect(500);
	});

	test("should return 500 error if database response is empty", async () => {
		jest.spyOn(db, "sql").mockImplementationOnce(
			jest.fn().mockResolvedValueOnce({
				rows: [],
			}),
		);
		await agent.get("/api/v2/event/checklist").expect(500);
	});
});
