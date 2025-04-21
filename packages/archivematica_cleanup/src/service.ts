import * as Sentry from "@sentry/node";
import { logger } from "@stela/logger";

export const cleanupDashboard = async (): Promise<void> => {
	const transferDeleteResponse = await fetch(
		`${process.env["ARCHIVEMATICA_BASE_URL"] ?? ""}/api/transfer/delete`,
		{
			method: "DELETE",
			headers: {
				Authorization: `ApiKey ${process.env["ARCHIVEMATICA_API_KEY"] ?? ""}`,
			},
		},
	);
	if (!transferDeleteResponse.ok) {
		logger.error(await transferDeleteResponse.text());
		Sentry.captureMessage(await transferDeleteResponse.text());
		return;
	}
	const ingestDeleteResponse = await fetch(
		`${process.env["ARCHIVEMATICA_BASE_URL"] ?? ""}/api/ingest/delete`,
		{
			method: "DELETE",
			headers: {
				Authorization: `ApiKey ${process.env["ARCHIVEMATICA_API_KEY"] ?? ""}`,
			},
		},
	);
	if (!ingestDeleteResponse.ok) {
		logger.error(await ingestDeleteResponse.text());
		Sentry.captureMessage(await ingestDeleteResponse.text());
	}
};
