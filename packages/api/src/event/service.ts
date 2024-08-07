import createError from "http-errors";
import { UAParser } from "ua-parser-js";
import { logger } from "@stela/logger";
import { db } from "../database";
import { mixpanelClient } from "../mixpanel";
import type { CreateEventRequest, ChecklistItem } from "./models";
import {
  isInvalidEnumError,
  getInvalidValueFromInvalidEnumMessage,
} from "../database_util";

export const createEvent = async (data: CreateEventRequest): Promise<void> => {
  if (data.body.analytics) {
    const { browser, os, device } = UAParser(data.userAgent);
    try {
      const analyticsData: { [key: string]: unknown; distinct_id?: string } =
        data.body.analytics.data;
      analyticsData.distinct_id = data.body.analytics.distinctId;
      analyticsData["$browser"] = browser.name;
      analyticsData["$os"] = os.name;
      analyticsData["$device"] = device.type;
      analyticsData["ip"] = data.ip;
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

const checklistEvents: Record<string, string> = {
  archiveCreated: "Create your first archive",
  storageRedeemed: "Redeem free storage",
  legacyContact: "Assign a Legacy Contact",
  archiveSteward: "Assign an Archive Steward",
  archiveProfile: "Update Archive Profile",
  firstUpload: "Upload first file",
  publishContent: "Publish your archive",
};

export const getChecklistEvents = async (
  email: string
): Promise<ChecklistItem[]> => {
  const eventResult = await db
    .sql<Record<string, boolean>>("event.queries.get_checklist_events", {
      email,
    })
    .catch((err) => {
      logger.error(err);
      throw new createError.InternalServerError(
        "Failed to retrieve checklist data"
      );
    });
  if (!eventResult.rows[0]) {
    throw new createError.InternalServerError(
      "Failed to retrieve checklist data"
    );
  }
  const eventData = eventResult.rows[0];
  return Object.keys(checklistEvents).map((key: string) => ({
    id: key,
    title: checklistEvents[key] ?? "",
    completed: eventData[key] ?? false,
  }));
};
