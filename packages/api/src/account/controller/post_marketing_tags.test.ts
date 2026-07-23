import request from "supertest";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { Md5 } from "ts-md5";
import { app } from "../../app";
import { MailchimpMarketing } from "../../mailchimp";
import { mockVerifyUserAuthentication } from "../../../test/middleware_mocks";

vi.mock("../../mailchimp", () => ({
	MailchimpMarketing: {
		lists: {
			updateListMemberTags: vi.fn(),
			getListMemberTags: vi.fn(),
		},
	},
}));
vi.mock("../../middleware");

describe("postMarketingTags", () => {
	const agent = request.agent(app);
	const testEmail = "test@permanent.org";
	const testUserSubject = "b5461dc2-1eb0-450e-b710-fef7b2cafe1e";
	const listId = process.env["MAILCHIMP_COMMUNITY_LIST_ID"] ?? "";
	const subscriberHash = Md5.hashStr(testEmail);

	beforeEach(() => {
		vi.clearAllMocks();
		mockVerifyUserAuthentication(testEmail, testUserSubject);
	});

	test("should add tags and return the current tag list", async () => {
		vi.mocked(MailchimpMarketing.lists.updateListMemberTags).mockResolvedValue(
			null,
		);
		vi.mocked(MailchimpMarketing.lists.getListMemberTags).mockResolvedValue({
			tags: [
				{ id: 1, name: "tag1", date_added: "2024-01-01 00:00:00" },
				{ id: 2, name: "tag2", date_added: "2024-01-01 00:00:00" },
			],
			total_items: 2,
		});

		const response = await agent
			.post("/api/v2/accounts/me/marketing-tags")
			.send({
				emailFromAuthToken: testEmail,
				userSubjectFromAuthToken: testUserSubject,
				tags: ["tag1", "tag2"],
			})
			.expect(200);

		expect(MailchimpMarketing.lists.updateListMemberTags).toHaveBeenCalledWith(
			listId,
			subscriberHash,
			{
				tags: [
					{ name: "tag1", status: "active" },
					{ name: "tag2", status: "active" },
				],
			},
		);
		expect(MailchimpMarketing.lists.getListMemberTags).toHaveBeenCalledWith(
			listId,
			subscriberHash,
		);
		expect(response.body).toEqual({ items: ["tag1", "tag2"] });
	});

	test("should return a 400 error if the caller tries to add 0 tags", async () => {
		await agent
			.post("/api/v2/accounts/me/marketing-tags")
			.send({
				emailFromAuthToken: testEmail,
				userSubjectFromAuthToken: testUserSubject,
				tags: [],
			})
			.expect(400);
	});

	test("should return an error if updateListMemberTags fails", async () => {
		vi.mocked(MailchimpMarketing.lists.updateListMemberTags).mockRejectedValue({
			status: 500,
		});

		await agent
			.post("/api/v2/accounts/me/marketing-tags")
			.send({
				emailFromAuthToken: testEmail,
				userSubjectFromAuthToken: testUserSubject,
				tags: ["tag1"],
			})
			.expect(500);

		expect(MailchimpMarketing.lists.getListMemberTags).not.toHaveBeenCalled();
	});

	test("should return an error if getListMemberTags fails", async () => {
		vi.mocked(MailchimpMarketing.lists.updateListMemberTags).mockResolvedValue(
			null,
		);
		vi.mocked(MailchimpMarketing.lists.getListMemberTags).mockRejectedValue({
			status: 404,
			response: {
				body: {
					detail: "Member not found",
					status: 404,
					type: "",
					title: "",
					instance: "",
				},
			},
		});

		await agent
			.post("/api/v2/accounts/me/marketing-tags")
			.send({
				emailFromAuthToken: testEmail,
				userSubjectFromAuthToken: testUserSubject,
				tags: ["tag1"],
			})
			.expect(404);
	});

	test("should default to a 500 error if the error from Mailchimp has no status", async () => {
		vi.mocked(MailchimpMarketing.lists.updateListMemberTags).mockRejectedValue({
			error: "Out of cheese - redo from start",
		});

		await agent
			.post("/api/v2/accounts/me/marketing-tags")
			.send({
				emailFromAuthToken: testEmail,
				userSubjectFromAuthToken: testUserSubject,
				tags: ["tag1"],
			})
			.expect(500);

		expect(MailchimpMarketing.lists.getListMemberTags).not.toHaveBeenCalled();
	});

	test("should return a bad request error if tags is missing", async () => {
		await agent
			.post("/api/v2/accounts/me/marketing-tags")
			.send({
				emailFromAuthToken: testEmail,
				userSubjectFromAuthToken: testUserSubject,
			})
			.expect(400);
	});

	test("should return a bad request error if tags contains non-strings", async () => {
		await agent
			.post("/api/v2/accounts/me/marketing-tags")
			.send({
				emailFromAuthToken: testEmail,
				userSubjectFromAuthToken: testUserSubject,
				tags: [1, 2, 3],
			})
			.expect(400);
	});
});
