import createError from "http-errors";
import { logger } from "@stela/logger";

import { db } from "../database";
import type { NotificationRow } from "./models";

const getMyNotificationsSince = async (
  accountEmail: string,
  archiveId: string,
  lastNotificationId: string
): Promise<NotificationRow[]> => {
  const result = await db
    .sql<NotificationRow>("notification.queries.get_my_notifications_since", {
      accountEmail,
      archiveId,
      lastNotificationId,
    })
    .catch((err) => {
      logger.error(err);
      throw new createError.InternalServerError(
        "Failed to retrieve my notifications since"
      );
    });

  return result.rows;
};

export const notificationService = {
  getMyNotificationsSince,
};
