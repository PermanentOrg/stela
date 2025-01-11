export interface CreatePromoRequest {
  emailFromAuthToken: string;
  adminSubjectFromAuthToken: string;
  code: string;
  storageInMB: number;
  expirationTimestamp: string;
  totalUses: number;
}

export interface Promo {
  id: string;
  code: string;
  storageInMB: number;
  expirationTimestamp: string;
  remainingUses: number;
  status: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export interface PromoRow {
  id: string;
  code: string;
  storageInMB: string;
  expirationTimestamp: string;
  remainingUses: string;
  status: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}
