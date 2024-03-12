import createError from "http-errors";
import { logger } from "@stela/logger";
import { db } from "../database";
import { mixpanelClient } from "../mixpanel";
import type { CreateEventRequest } from "./models";
import {
  isInvalidEnumError,
  getInvalidValueFromInvalidEnumMessage,
} from "../database_util";

export const createEvent = async (data: CreateEventRequest): Promise<void> => {
  if (data.body.analytics) {
    try {
      const analyticsData: { [key: string]: unknown; distinct_id?: string } =
        data.body.analytics.data;
      analyticsData.distinct_id = data.body.analytics.distinctId;
      mixpanelClient.track(data.body.analytics.event, analyticsData);
    } catch (err) {
      logger.error(err);
      throw new createError.InternalServerError(
        `Failed to track mixpanel event`
      );
    }
  }
  const actorType = data.userSubjectFromAuthToken ?? "" ? "user" : "admin";
  await db
    .sql("event.queries.create_event", {
      entity: data.entity,
      action: data.action,
      version: data.version,
      actorType,
      actorId: data.userSubjectFromAuthToken ?? data.adminSubjectFromAuthToken,
      entityId: data.entityId,
      ip: data.ip,
      userAgent: data.userAgent,
      body: data.body,
    })
    .catch((err) => {
      if (isInvalidEnumError(err)) {
        const badValue = getInvalidValueFromInvalidEnumMessage(err.message);
        const badKey = badValue === data.entity ? "entity" : "action";
        throw new createError.BadRequest(
          `${badValue} is not a valid value for ${badKey}`
        );
      }
      logger.error(err);
      throw new createError.InternalServerError(`Failed to create event`);
    });
};
