export interface CreateLegacyContactRequest {
	email: string;
	name: string;
}

export interface UpdateLegacyContactRequest {
	email?: string;
	name?: string;
}

export interface LegacyContact {
	legacyContactId: string;
	accountId: string;
	name: string;
	email: string;
	createdDt: string;
	updatedDt: string;
}
