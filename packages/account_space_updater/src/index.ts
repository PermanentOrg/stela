import type { SQSHandler, SQSEvent, SQSRecord } from "aws-lambda";
import { TinyPgError } from "tinypg";
import { logger } from "@stela/logger";
import { db } from "./database";
import { validateRecordSubmitEvent } from "./validators";

enum Operation {
  Upload = "type.billing.file_upload",
  Copy = "type.billing.file_copy",
}

const duplicateLedgerNonfinancialError =
  'duplicate key value violates unique constraint "idx_ledger_nonfinancial_file_id_type"';

export const extractFileAttributesFromS3Message = (
  message: SQSRecord
): { recordId: string; operation: Operation } => {
  const { body } = message;
  const parsedBody: unknown = JSON.parse(body);
  if (!validateRecordSubmitEvent(parsedBody)) {
    logger.error(`Invalid message body: ${body}`);
    throw new Error("Invalid message body");
  }
  const { recordId } = parsedBody;
  const action = message.messageAttributes["Action"]?.stringValue;
  if (action === undefined) {
    logger.error(
      `Action attribute is missing from request: ${JSON.stringify(message)}`
    );
    throw new Error("Action attribute is missing");
  }
  const operation = action === "submit" ? Operation.Upload : Operation.Copy;
  return { recordId, operation };
};

export const handler: SQSHandler = async (event: SQSEvent, _, __) => {
  await Promise.all(
    event.Records.map(async (message) => {
      const { recordId, operation } =
        extractFileAttributesFromS3Message(message);
      try {
        await db.sql("queries.update_account_space", { recordId, operation });
      } catch (err: unknown) {
        // If the error occurred because the ledger entry already exists, we can safely ignore the error.
        // Otherwise, rethrow it
        if (
          !(
            err instanceof TinyPgError &&
            err.message === duplicateLedgerNonfinancialError
          )
        ) {
          logger.error(err);
          throw err;
        }
      }
    })
  );
};
