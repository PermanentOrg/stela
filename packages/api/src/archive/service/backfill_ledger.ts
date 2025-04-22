import createError from "http-errors";
import { logger } from "@stela/logger";
import { db } from "../../database";
import { publisherClient } from "../../publisher_client";

export const backfillLedger = async (archiveId: string): Promise<void> => {
	const backfillRecords = await db
		.sql<{ recordId: string }>(
			"archive.queries.update_payer_accounts_for_ledger_backfill",
			{
				archiveId,
			},
		)
		.catch((err) => {
			logger.error(err);
			throw new createError.InternalServerError(
				"failed to update payer accounts",
			);
		});

	await Promise.all(
		backfillRecords.rows.map(async (record) => {
			const message = {
				entity: "record",
				action: "create",
				body: {
					record: {
						recordId: record.recordId,
					},
				},
			};

			await publisherClient
				.publishMessage(process.env["EVENT_TOPIC_ARN"] ?? "", {
					id: record.recordId,
					body: JSON.stringify(message),
					attributes: { Entity: "record", Action: "create" },
				})
				.catch((err: unknown) => {
					logger.error(err);
					throw new createError.InternalServerError(
						"failed to send account space update message",
					);
				});
		}),
	);
};
