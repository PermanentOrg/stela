import createError from "http-errors";
import type {
  CreateDirectiveRequest,
  Directive,
  DirectiveTrigger,
} from "../model";
import { db } from "../../database";
import {
  isInvalidEnumError,
  getInvalidValueFromInvalidEnumMessage,
} from "../../database_util";
import { logger } from "../../log";

interface HasAccessResult {
  hasAccess: boolean;
}

export const createDirective = async (
  requestBody: CreateDirectiveRequest
): Promise<Directive> => {
  const accessResult = await db.sql<HasAccessResult>(
    "directive.queries.check_archive_ownership",
    {
      archiveId: requestBody.archiveId,
      email: requestBody.emailFromAuthToken,
    }
  );
  if (!accessResult.rows[0] || !accessResult.rows[0].hasAccess) {
    throw new createError.NotFound("Archive not found");
  }

  const directiveToReturn = await db.transaction(async (transactionDb) => {
    const directive = await (async (): Promise<Directive> => {
      try {
        const directiveResult = await transactionDb.sql<Directive>(
          "directive.queries.create_directive",
          {
            archiveId: requestBody.archiveId,
            type: requestBody.type,
            stewardAccountId: requestBody.stewardAccountId ?? null,
            note: requestBody.note ?? null,
          }
        );
        if (directiveResult.rows[0] === undefined) {
          throw new Error();
        }
        return directiveResult.rows[0];
      } catch (err) {
        if (isInvalidEnumError(err)) {
          throw new createError.BadRequest(
            `${getInvalidValueFromInvalidEnumMessage(
              err.message
            )} is not a valid value for "type"`
          );
        }
        logger.error(err);
        throw new createError.InternalServerError("Failed to create directive");
      }
    })();

    const trigger = await (async (): Promise<DirectiveTrigger> => {
      try {
        const triggerResult = await transactionDb.sql<DirectiveTrigger>(
          "directive.queries.create_directive_trigger",
          { directiveId: directive.directiveId, type: requestBody.trigger.type }
        );
        if (triggerResult.rows[0] === undefined) {
          throw new Error();
        }
        return triggerResult.rows[0];
      } catch (err) {
        if (isInvalidEnumError(err)) {
          throw new createError.BadRequest(
            `${getInvalidValueFromInvalidEnumMessage(
              err.message
            )} is not a valid value for "trigger.type"`
          );
        }
        logger.error(err);
        throw new createError.InternalServerError("Failed to create directive");
      }
    })();
    directive.trigger = trigger;
    return directive;
  });

  return directiveToReturn;
};
