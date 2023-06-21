import { Md5 } from "ts-md5";
import createError from "http-errors";
import { db } from "../database";
import { logger } from "../log";
import { MailchimpMarketing } from "../mailchimp";
import type { UpdateTagsRequest, SignupDetails } from "./models";

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

  const response = await MailchimpMarketing.lists.updateListMemberTags(
    process.env["MAILCHIMP_COMMUNITY_LIST_ID"] ?? "",
    Md5.hashStr(requestBody.emailFromAuthToken),
    { tags }
  );

  if (response) {
    throw createError(response.status, response.detail);
  }
};

const getSignupDetails = async (
  accountEmail: string
): Promise<SignupDetails> => {
  const signupDetailResult = await db
    .sql<SignupDetails>("account.queries.get_signup", {
      email: accountEmail,
    })
    .catch((err) => {
      logger.error(err);
      throw new createError.InternalServerError(
        "Failed to retrieve signup details"
      );
    });
  if (!signupDetailResult.rows[0]) {
    throw new createError.NotFound("Signup details not found");
  }
  return signupDetailResult.rows[0];
};

export const accountService = {
  updateTags,
  getSignupDetails,
};
