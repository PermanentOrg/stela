import { createDirective } from "./create.js";
import { updateDirective } from "./update.js";
import { triggerAccountAdminDirectives } from "./trigger_by_account.js";
import { getDirectivesByArchiveId } from "./get_by_archive_id.js";

export const directiveService = {
	createDirective,
	updateDirective,
	triggerAccountAdminDirectives,
	getDirectivesByArchiveId,
};
