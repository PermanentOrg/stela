import { Md5 } from "ts-md5";
import { MailchimpMarketing } from "../mailchimp";
import { accountService } from "./service";
import type { UpdateTagsRequest } from "./models";

jest.mock("../mailchimp", () => ({
  MailchimpMarketing: {
    lists: {
      updateListMemberTags: jest.fn(),
    },
  },
}));

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

  await accountService.updateTags(requestBody);

  expect(MailchimpMarketing.lists.updateListMemberTags).toHaveBeenCalledWith(
    expectedListId,
    expectedSubscriberHash,
    { tags: expectedTags }
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
  let error = null;
  try {
    await accountService.updateTags({
      emailFromAuthToken: "test@permanent.org",
      addTags: ["tag1", "tag2"],
      removeTags: ["tag3", "tag4"],
    });
  } catch (err) {
    error = err;
  } finally {
    expect(error).not.toBeNull();
  }
});
