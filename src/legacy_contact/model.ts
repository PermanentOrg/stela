export interface CreateLegacyContactRequest {
  emailFromAuthToken: string;
  email: string;
  name: string;
}

export interface LegacyContact {
  legacyContactId: string;
  accountId: string;
  name: string;
  email: string;
  createdDt: Date;
  updatedDt: Date;
}
