import { v4 as uuidv4 } from "uuid";
import createError from "http-errors";
import { logger } from "@stela/logger";
import type { CreateShareLinkRequest, ShareLink } from "./models";
import { db } from "../database";
import {
  getItemAccessRole,
  accessRoleLessThan,
  isItemPublic,
} from "../access/permission";
import { AccessRole } from "../access/models";

const createShareLink = async (
  data: CreateShareLinkRequest
): Promise<ShareLink> => {
  const accessRole = await getItemAccessRole(
    data.itemId,
    data.itemType,
    data.emailFromAuthToken
  );
  if (accessRoleLessThan(accessRole, AccessRole.Manager)) {
    throw new createError.Forbidden(
      "User does not have permission to share item."
    );
  }

  const itemIsPublic = await isItemPublic(data.itemId, data.itemType);
  if (itemIsPublic && data.accessRestrictions === "none") {
    throw new createError.BadRequest(
      "Unrestricted links cannot be created for public items; use the public link instead"
    );
  }

  const shareToken = uuidv4();
  const result = await db
    .sql<ShareLink>("share_link.queries.create_share_link", {
      itemId: data.itemId,
      itemType: data.itemType,
      permissionsLevel: `access.role.${data.permissionsLevel ?? "viewer"}`,
      unlisted:
        (data.accessRestrictions === "none" ||
          data.accessRestrictions === undefined) &&
        !itemIsPublic,
      noApproval: data.accessRestrictions !== "approval" ? 1 : 0,
      maxUses: data.maxUses ?? 0,
      expirationTimestamp: data.expirationTimestamp,
      urlToken: shareToken,
      shareUrl: `https://${process.env["SITE_URL"] ?? ""}/share/${shareToken}`,
      email: data.emailFromAuthToken,
    })
    .catch((err) => {
      logger.error(err);
      throw new Error("Failed to create share link");
    });

  if (result.rows[0] === undefined) {
    const errorMessage = `Could not find a ${data.itemType} with ID: ${data.itemId} to share`;
    logger.error(errorMessage);
    throw createError.NotFound(errorMessage);
  }

  return {
    ...result.rows[0],
    maxUses: result.rows[0].maxUses !== null ? +result.rows[0].maxUses : null,
    usesExpended:
      result.rows[0].usesExpended !== null
        ? +result.rows[0].usesExpended
        : null,
  };
};

export const shareLinkService = { createShareLink };
