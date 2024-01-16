import createError, { BadRequest } from "http-errors";
import { logger } from "@stela/logger";
import { db } from "../../database";
import {
  isInvalidEnumError,
  isMissingStewardAccountError,
  getInvalidValueFromInvalidEnumMessage,
} from "../../database_util";
import { sendArchiveStewardNotification } from "../../email";
import type {
  UpdateDirectiveRequest,
  Directive,
  DirectiveTrigger,
} from "../model";

export const updateDirective = async (
  directiveId: string,
  requestBody: UpdateDirectiveRequest
): Promise<Directive> => {
  const accessResult = await db.sql<{ hasAccess: boolean }>(
    "directive.queries.check_directive_ownership",
    {
      directiveId,
      email: requestBody.emailFromAuthToken,
    }
  );
  if (!accessResult.rows[0] || !accessResult.rows[0].hasAccess) {
    throw new createError.NotFound("Directive not found");
  }

  const directiveData = await db.transaction(async (transactionDb) => {
    const directive = await (async (): Promise<
      Directive & { stewardChanged: boolean }
    > => {
      try {
        const directiveResult = await transactionDb.sql<
          Directive & { stewardChanged: boolean }
        >("directive.queries.update_directive", {
          directiveId,
          type: requestBody.type,
          stewardEmail: requestBody.stewardEmail,
          note: requestBody.note,
        });
        if (directiveResult.rows[0] === undefined) {
          throw new createError.BadRequest(
            "Directives cannot be updated after they've been executed"
          );
        }
        return directiveResult.rows[0];
      } catch (err) {
        if (isInvalidEnumError(err)) {
          throw new createError.BadRequest(
            `${getInvalidValueFromInvalidEnumMessage(
              err.message
            )} is not a valid value for "type"`
          );
        } else if (isMissingStewardAccountError(err)) {
          throw new createError.BadRequest(
            "Steward email must have an account"
          );
        } else if (err instanceof BadRequest) {
          throw err;
        }
        logger.error(err);
        throw new createError.InternalServerError("Failed to update directive");
      }
    })();

    const trigger = await (async (): Promise<DirectiveTrigger> => {
      try {
        const triggerResult = await transactionDb.sql<DirectiveTrigger>(
          "directive.queries.update_directive_trigger",
          {
            directiveId: directive.directiveId,
            type: requestBody.trigger?.type,
          }
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
        throw new createError.InternalServerError(
          "Failed to update directive trigger"
        );
      }
    })();
    directive.trigger = trigger;
    return directive;
  });

  const { stewardChanged, ...directiveToReturn } = directiveData;
  if (stewardChanged) {
    await sendArchiveStewardNotification(directiveToReturn.directiveId).catch(
      (err) => {
        logger.error(err);
      }
    );
  }

  return directiveToReturn;
};
