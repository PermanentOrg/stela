import { Md5 } from "ts-md5";
import createError from "http-errors";
import { MailChimpClient } from "../mailchimp";
import type { UpdateTagsRequest } from "./models";

const updateTags = async (requestBody: UpdateTagsRequest): Promise<void> => {
  const tags = (requestBody.addTags ?? [])
    .map((tag): { name: string; status: "active" | "inactive" } => ({
      name: tag,
      status: "active",
    }))
    .concat(
      (requestBody.removeTags ?? []).map(
        (tag): { name: string; status: "active" | "inactive" } => ({
          name: tag,
          status: "inactive",
        })
      )
    );

  const response = await MailChimpClient.lists.updateListMemberTags(
    process.env["MAILCHIMP_COMMUNITY_LIST_ID"] ?? "",
    Md5.hashStr(requestBody.emailFromAuthToken),
    { tags }
  );

  if (response) {
    throw createError(response.status, response.detail);
  }
};

export const accountService = {
  updateTags,
};
