import request from "supertest";
import type { Request, NextFunction } from "express";
import { Md5 } from "ts-md5";
import { app } from "../../app";
import { verifyUserAuthentication } from "../../middleware";
import { MailchimpMarketing } from "../../mailchimp";
import type { UpdateTagsRequest } from "../models";

jest.mock("../../mailchimp", () => ({
	MailchimpMarketing: {
		lists: {
			updateListMemberTags: jest.fn(),
		},
	},
}));
jest.mock("../../middleware");

describe("updateTags", () => {
	const agent = request.agent(app);

	beforeEach(() => {
		(verifyUserAuthentication as jest.Mock).mockImplementation(
			async (
				req: Request<
					unknown,
					unknown,
					{ userSubjectFromAuthToken?: string; emailFromAuthToken?: string }
				>,
				__,
				next: NextFunction,
			) => {
				req.body.emailFromAuthToken = "test@permanent.org";
				req.body.userSubjectFromAuthToken =
					"b5461dc2-1eb0-450e-b710-fef7b2cafe1e";

				next();
			},
		);
		jest.clearAllMocks();
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

		(
			MailchimpMarketing.lists.updateListMemberTags as jest.MockedFunction<
				typeof MailchimpMarketing.lists.updateListMemberTags
			>
		).mockResolvedValue(null);

		await agent.put("/api/v2/account/tags").send(requestBody).expect(200);

		expect(MailchimpMarketing.lists.updateListMemberTags).toHaveBeenCalledWith(
			expectedListId,
			expectedSubscriberHash,
			{ tags: expectedTags },
		);
	});

	test("should throw an error if MailChimp call fails", async () => {
		(
			MailchimpMarketing.lists.updateListMemberTags as jest.MockedFunction<
				typeof MailchimpMarketing.lists.updateListMemberTags
			>
		).mockResolvedValue({
			detail: "Out of Cheese - Redo from Start",
			status: 500,
			type: "",
			title: "",
			instance: "",
		});
		await agent
			.put("/api/v2/account/tags")
			.send({
				emailFromAuthToken: "test@permanent.org",
				addTags: ["tag1", "tag2"],
				removeTags: ["tag3", "tag4"],
			})
			.expect(500);
	});

	test("should throw a bad request error if the request body is invalid", async () => {
		await agent
			.put("/api/v2/account/tags")
			.send({
				emailFromAuthToken: "test@permanent.org",
				addTags: [1, 2, 4],
				removeTags: ["tag3", "tag4"],
			})
			.expect(400);
	});
});
