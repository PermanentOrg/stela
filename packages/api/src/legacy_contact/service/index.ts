import { createLegacyContact } from "./create.js";
import { getLegacyContactsByAccountId } from "./get_by_account_id.js";
import { updateLegacyContact } from "./update.js";

export const legacyContactService = {
	createLegacyContact,
	getLegacyContactsByAccountId,
	updateLegacyContact,
};
