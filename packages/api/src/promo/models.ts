export interface ClaimPromoRequest {
	emailFromAuthToken: string;
	userSubjectFromAuthToken: string;
	promoCode: string;
}

export interface ClaimPromoResponse {
	storageGrantInGb: number;
}

export interface PromoByCodeRow {
	id: string;
	storageInMB: string;
	expirationTimestamp: Date;
	remainingUses: string;
	status: string;
}

export interface AccountPromoCheckRow {
	accountId: string;
	existingClaimId: string | null;
}

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
	expirationTimestamp: Date;
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
	expirationTimestamp: Date;
	remainingUses: string;
	status: string;
	type: string;
	createdAt: Date;
	updatedAt: Date;
}
