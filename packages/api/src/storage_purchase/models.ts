export interface StoragePurchaseRequest {
	emailFromAuthToken: string;
	userSubjectFromAuthToken: string;
	amountInUSD: number;
}

export interface StoragePurchaseResponse {
	clientSecret: string;
}
