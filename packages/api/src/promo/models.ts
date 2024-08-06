export interface CreatePromoRequest {
  emailFromAuthToken: string;
  userSubjectFromAuthToken: string;
  code: string;
  storageInMB: number;
  expirationTimestamp: string;
  totalUses: Date;
}

export interface Promo {
  id: string;
  code: string;
  storageInMB: number;
  expirationTimestamp: string;
  remainingUses: number;
  status: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PromoRow {
  id: string;
  code: string;
  storageInMB: string;
  expirationTimestamp: string;
  remainingUses: string;
  status: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
}
