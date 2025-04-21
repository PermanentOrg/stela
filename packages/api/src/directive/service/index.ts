import { createDirective } from "./create";
import { updateDirective } from "./update";
import { triggerAccountAdminDirectives } from "./trigger_by_account";
import { getDirectivesByArchiveId } from "./get_by_archive_id";

export const directiveService = {
	createDirective,
	updateDirective,
	triggerAccountAdminDirectives,
	getDirectivesByArchiveId,
};
