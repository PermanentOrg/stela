import { createLegacyContact } from "./create";
import { getLegacyContactsByAccountId } from "./get_by_account_id";
import { updateLegacyContact } from "./update";

export const legacyContactService = {
	createLegacyContact,
	getLegacyContactsByAccountId,
	updateLegacyContact,
};
