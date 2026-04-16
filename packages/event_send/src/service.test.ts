import { logger } from "@stela/logger";
import { publisherClient } from "@stela/publisher-utils";
import { mixpanelClient } from "./mixpanel";
import { sendEvents } from "./service";
import { db } from "./database";

jest.mock("@stela/logger");
jest.mock("./database");
jest.mock("./mixpanel");

const loadFixtures = async (): Promise<void> => {
	await db.sql("fixtures.create_test_events");
};

const clearDatabase = async (): Promise<void> => {
	await db.query("TRUNCATE event CASCADE");
};

const getEventSentStatus = async (entityId: string): Promise<boolean> => {
	const result = await db.query<{ isSent: boolean }>(
		`SELECT is_sent AS "isSent" FROM event WHERE entity_id = :entityId`,
		{ entityId },
	);
	if (result.rows[0] === undefined) {
		expect(false).toBe(true);
		return false;
	}
	return result.rows[0].isSent;
};

describe("sendEvents", () => {
	beforeEach(async () => {
		jest
			.spyOn(publisherClient, "batchPublishMessages")
			.mockResolvedValue({ messagesSent: 3, failedMessages: [] });
		await loadFixtures();
	});

	afterEach(async () => {
		jest.restoreAllMocks();
		jest.clearAllMocks();
		await clearDatabase();
	});

	test("should send unsent events to SNS", async () => {
		await sendEvents();

		expect(publisherClient.batchPublishMessages).toHaveBeenCalledWith(
			process.env["EVENT_TOPIC_ARN"] ?? "",
			expect.arrayContaining([
				expect.objectContaining({
					attributes: { Entity: "archive", Action: "create" },
				}),
				expect.objectContaining({
					attributes: { Entity: "record", Action: "update" },
				}),
			]),
		);
	});

	test("should not send already-sent events to SNS", async () => {
		await sendEvents();

		const {
			mock: {
				calls: [call],
			},
		} = jest.mocked(publisherClient.batchPublishMessages);
		const messages = call?.[1] ?? [];
		expect(
			messages.some(
				(m) =>
					m.attributes?.["Entity"] === "folder" &&
					m.attributes["Action"] === "create",
			),
		).toBe(false);
	});

	test("should mark sent events as sent in the database", async () => {
		await sendEvents();

		expect(await getEventSentStatus("1")).toBe(true);
		expect(await getEventSentStatus("2")).toBe(true);
	});

	test("should not mark an event as sent if SNS publish failed", async () => {
		const result = await db.query<{ id: string }>(
			"SELECT id FROM event WHERE entity_id = '1'",
		);
		const archiveEventId = result.rows[0]?.id ?? "";

		jest
			.spyOn(publisherClient, "batchPublishMessages")
			.mockResolvedValue({ messagesSent: 1, failedMessages: [archiveEventId] });

		await sendEvents();

		expect(await getEventSentStatus("1")).toBe(false);
		expect(await getEventSentStatus("2")).toBe(true);
	});

	test("should do nothing when there are no unsent events", async () => {
		await db.query("UPDATE event SET is_sent = TRUE");

		await sendEvents();

		expect(publisherClient.batchPublishMessages).not.toHaveBeenCalled();
	});

	test("should send Mixpanel event for events with analytics data", async () => {
		await sendEvents();

		expect(mixpanelClient.track).toHaveBeenCalledWith("Sign Up", {
			distinct_id: "local:4",
			accountId: "4",
			$browser: "Mobile Chrome",
			$device: "mobile",
			$os: "iOS",
			ip: "127.0.0.1",
		});
	});

	test("should not send Mixpanel events for events without analytics data", async () => {
		await sendEvents();

		expect(mixpanelClient.track).toHaveBeenCalledTimes(1);
	});

	test("should log an error and continue if Mixpanel tracking fails", async () => {
		jest.mocked(mixpanelClient.track).mockImplementation(() => {
			throw new Error("Mixpanel error");
		});

		await sendEvents();

		expect(logger.error).toHaveBeenCalled();
		expect(publisherClient.batchPublishMessages).toHaveBeenCalled();
	});

	test("should log and rethrow an error if database fetch fails", async () => {
		expect.assertions(2);
		const errorMessage = "database connection failed";
		jest.spyOn(db, "sql").mockRejectedValue(errorMessage);

		await sendEvents().catch((err: unknown) => {
			expect(err).toEqual(errorMessage);
		});

		expect(logger.error).toHaveBeenCalled();
	});

	test("should log and rethrow an error if SNS publish fails", async () => {
		expect.assertions(2);
		const error = new Error("SNS publish failed");
		jest
			.spyOn(publisherClient, "batchPublishMessages")
			.mockRejectedValue(error);

		await sendEvents().catch((err: unknown) => {
			expect(err).toBe(error);
		});

		expect(logger.error).toHaveBeenCalled();
	});

	test("should log and rethrow an error if database update fails", async () => {
		expect.assertions(2);
		const errorMessage = "database update failed";
		jest
			.spyOn(db, "sql")
			.mockImplementationOnce(
				jest.fn().mockResolvedValue({
					rows: [
						{
							id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
							entity: "archive",
							action: "create",
							version: 1,
							actorType: "user",
							actorId: "553f3cb8-b753-43ce-83af-4443a404741b",
							entityId: "1",
							ip: null,
							userAgent: null,
							body: {},
						},
					],
				}),
			)
			.mockRejectedValueOnce(errorMessage);

		await sendEvents().catch((err: unknown) => {
			expect(err).toEqual(errorMessage);
		});

		expect(logger.error).toHaveBeenCalled();
	});
});
