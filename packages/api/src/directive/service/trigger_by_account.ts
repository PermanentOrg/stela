import type { DirectiveExecutionResult } from "../model";
import { db } from "../../database";
import { legacyClient } from "../../legacy_client";
import { HTTP_STATUS } from "@pdc/http-status-codes";

const directiveExecutionOutcomeSuccess = "success";
const directiveExecutionOutcomeError = "error";

export const triggerAccountAdminDirectives = async (
	accountId: string,
): Promise<DirectiveExecutionResult[]> => {
	const adminDirectives = await db.sql<{
		archiveSlug: string;
		stewardEmail: string;
		directiveId: string;
		archiveId: string;
		directiveType: string;
		note: string;
	}>("directive.queries.get_admin_directive_execution_data_by_account", {
		accountId,
	});

	const results = await Promise.all(
		adminDirectives.rows.map(
			async (directive): Promise<DirectiveExecutionResult> => {
				if (directive.directiveType === "transfer") {
					const response = await legacyClient.transferArchiveOwnership({
						recipientEmail: directive.stewardEmail,
						archiveSlug: directive.archiveSlug,
						message: directive.note,
						isLegacyAction: true,
					});
					if (response.status === (HTTP_STATUS.SUCCESSFUL.OK as number)) {
						return {
							archiveId: directive.archiveId,
							directiveId: directive.directiveId,
							outcome: directiveExecutionOutcomeSuccess,
						};
					}

					return {
						archiveId: directive.archiveId,
						directiveId: directive.directiveId,
						outcome: directiveExecutionOutcomeError,
						errorMessage: `Failed with error code: ${response.status}`,
					};
				}

				return {
					archiveId: directive.archiveId,
					directiveId: directive.directiveId,
					outcome: directiveExecutionOutcomeError,
					errorMessage: `Directive type ${directive.directiveType} not supported`,
				};
			},
		),
	);

	await db.sql("directive.queries.mark_directives_executed", {
		directiveIds: results
			.filter((result) => result.outcome === directiveExecutionOutcomeSuccess)
			.map((result) => result.directiveId),
	});

	return results;
};
