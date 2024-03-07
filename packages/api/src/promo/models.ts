export interface CreatePromoRequest {
  emailFromAuthToken: string;
  code: string;
  storageInMB: number;
  expirationTimestamp: string;
  totalUses: Date;
}
