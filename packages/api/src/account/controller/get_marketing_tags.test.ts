import request from "supertest";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { Md5 } from "ts-md5";
import { app } from "../../app";
import { MailchimpMarketing } from "../../mailchimp";
import { mockVerifyUserAuthentication } from "../../../test/middleware_mocks";

vi.mock("../../mailchimp", () => ({
	MailchimpMarketing: {
		lists: {
			getListMemberTags: vi.fn(),
		},
	},
}));
vi.mock("../../middleware");

describe("getMarketingTags", () => {
	const agent = request.agent(app);

	beforeEach(() => {
		vi.clearAllMocks();
		mockVerifyUserAuthentication(
			"test@permanent.org",
			"b5461dc2-1eb0-450e-b710-fef7b2cafe1e",
		);
	});

	test("should return a list of tag names for the authenticated account", async () => {
		vi.mocked(MailchimpMarketing.lists.getListMemberTags).mockResolvedValue({
			tags: [
				{ id: 1, name: "tag1", date_added: "2024-01-01" },
				{ id: 2, name: "tag2", date_added: "2024-01-02" },
			],
		});

		const response = await agent
			.get("/api/v2/accounts/me/marketing-tags")
			.expect(200);

		expect(response.body).toStrictEqual({ items: ["tag1", "tag2"] });
		expect(MailchimpMarketing.lists.getListMemberTags).toHaveBeenCalledWith(
			process.env["MAILCHIMP_COMMUNITY_LIST_ID"] ?? "",
			Md5.hashStr("test@permanent.org"),
		);
	});

	test("should return an empty list when the account has no tags", async () => {
		vi.mocked(MailchimpMarketing.lists.getListMemberTags).mockResolvedValue({
			tags: [],
		});

		const response = await agent
			.get("/api/v2/accounts/me/marketing-tags")
			.expect(200);

		expect(response.body).toStrictEqual({ items: [] });
	});

	test("should return an empty list when the account does not exist in Mailchimp", async () => {
		vi.mocked(MailchimpMarketing.lists.getListMemberTags).mockRejectedValue({
			status: 404,
			response: {
				body: {
					type: "https://mailchimp.com/developer/marketing/docs/errors/",
					title: "Resource Not Found",
					status: 404,
					detail: "The requested resource could not be found.",
					instance: "",
				},
			},
		});

		const response = await agent
			.get("/api/v2/accounts/me/marketing-tags")
			.expect(200);

		expect(response.body).toStrictEqual({ items: [] });
	});

	test("should throw an error if the Mailchimp call fails", async () => {
		vi.mocked(MailchimpMarketing.lists.getListMemberTags).mockRejectedValue({
			status: 500,
			response: {
				body: {
					type: "",
					title: "Internal Server Error",
					status: 500,
					detail: "Out of Cheese - Redo from Start",
					instance: "",
				},
			},
		});

		await agent.get("/api/v2/accounts/me/marketing-tags").expect(500);
	});

	test("should propagate the status code from an error even if a lacks a response object", async () => {
		vi.mocked(MailchimpMarketing.lists.getListMemberTags).mockRejectedValue({
			status: 418,
		});

		await agent.get("/api/v2/accounts/me/marketing-tags").expect(418);
	});

	test("should default to a 500 error if an error from Mailchimp has no status code", async () => {
		vi.mocked(MailchimpMarketing.lists.getListMemberTags).mockRejectedValue({
			error: "Out of cheese - redo from start",
		});

		await agent.get("/api/v2/accounts/me/marketing-tags").expect(500);
	});

	test("should return a bad request error if authentication fields are missing", async () => {
		mockVerifyUserAuthentication("test@permanent.org");
		await agent.get("/api/v2/accounts/me/marketing-tags").expect(400);
	});
});
