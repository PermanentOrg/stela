import { Md5 } from "ts-md5";
import createError from "http-errors";
import { logger } from "@stela/logger";
import { db } from "../database";
import { MailchimpMarketing } from "../mailchimp";
import type { UpdateTagsRequest, SignupDetails } from "./models";

interface GetAccountArchiveResult {
  accessRole: string;
  accountId: number;
}

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

const leaveArchive = (accountEmail: string, archiveId: string) => {
  return db.transaction(async (transactionDb) => {
    const accountArchiveResult =
      await transactionDb.sql<GetAccountArchiveResult>(
        "account.queries.get_account_archive",
        {
          archiveId,
          email: accountEmail,
        }
      );

    const accountArchive = accountArchiveResult.rows[0];

    if (!accountArchive) {
      throw new createError.BadRequest(
        `Unable to determine relationship with archiveId ${archiveId}`
      );
    }

    if (accountArchive.accessRole === "access.role.owner") {
      throw new createError.BadRequest(
        "Cannot leave archive while owning it. Either pass ownership to another account or delete archive."
      );
    }

    const deleteResult = await db.sql<{ accountArchiveId: string }>(
      "account.queries.delete_account_archive",
      {
        archiveId,
        email: accountEmail,
      }
    );

    if (!deleteResult.rows[0]) {
      throw new createError.InternalServerError(
        "Unexpected result while performing DELETE on account archive relationship."
      );
    }

    return deleteResult.rows[0];
  });
};

export const accountService = {
  getSignupDetails,
  leaveArchive,
  updateTags,
};
