import request from "supertest";
import { vi } from "vitest";
import { Md5 } from "ts-md5";
import { app } from "../../app";
import { MailchimpMarketing } from "../../mailchimp";
import type { UpdateTagsRequest } from "../models";
import { mockVerifyUserAuthentication } from "../../../test/middleware_mocks";

vi.mock("../../mailchimp", () => ({
	MailchimpMarketing: {
		lists: {
			updateListMemberTags: vi.fn(),
		},
	},
}));
vi.mock("../../middleware");

describe("updateTags", () => {
	const agent = request.agent(app);

	beforeEach(() => {
		vi.clearAllMocks();
		mockVerifyUserAuthentication(
			"test@permanent.org",
			"b5461dc2-1eb0-450e-b710-fef7b2cafe1e",
		);
	});

	test("should call updateListMemberTags with the correct arguments", async () => {
		const requestBody: UpdateTagsRequest = {
			emailFromAuthToken: "test@permanent.org",
			addTags: ["tag1", "tag2"],
			removeTags: ["tag3", "tag4"],
		};

		const expectedTags = [
			{ name: "tag1", status: "active" },
			{ name: "tag2", status: "active" },
			{ name: "tag3", status: "inactive" },
			{ name: "tag4", status: "inactive" },
		];

		const expectedListId = process.env["MAILCHIMP_COMMUNITY_LIST_ID"] ?? "";
		const expectedSubscriberHash = Md5.hashStr(requestBody.emailFromAuthToken);

		vi.mocked(MailchimpMarketing.lists.updateListMemberTags).mockResolvedValue(
			null,
		);

		await agent.put("/api/v2/accounts/tags").send(requestBody).expect(200);

		expect(MailchimpMarketing.lists.updateListMemberTags).toHaveBeenCalledWith(
			expectedListId,
			expectedSubscriberHash,
			{ tags: expectedTags },
		);
	});

	test("should throw an error if MailChimp call fails", async () => {
		vi.mocked(MailchimpMarketing.lists.updateListMemberTags).mockResolvedValue({
			detail: "Out of Cheese - Redo from Start",
			status: 500,
			type: "",
			title: "",
			instance: "",
		});
		await agent
			.put("/api/v2/accounts/tags")
			.send({
				emailFromAuthToken: "test@permanent.org",
				addTags: ["tag1", "tag2"],
				removeTags: ["tag3", "tag4"],
			})
			.expect(500);
	});

	test("should throw a bad request error if the request body is invalid", async () => {
		await agent
			.put("/api/v2/accounts/tags")
			.send({
				emailFromAuthToken: "test@permanent.org",
				addTags: [1, 2, 4],
				removeTags: ["tag3", "tag4"],
			})
			.expect(400);
	});
});
