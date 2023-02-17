import { createDirective } from "./create";
import { triggerAccountAdminDirectives } from "./trigger_by_account";
import { getDirectivesByArchiveId } from "./get_by_archive_id";

export const directiveService = {
  createDirective,
  triggerAccountAdminDirectives,
  getDirectivesByArchiveId,
};
