export interface PaymentSheetRequest {
	emailFromAuthToken: string;
	userSubjectFromAuthToken: string;
	accountId: number;
	amount: number;
	email: string;
	name: string;
	anonymous: boolean;
}

export interface PaymentSheetResponse {
	paymentIntentClientSecret: string;
	ephemeralKeySecret: string;
	customerId: string;
	publishableKey: string;
}

export interface DonationClaimStatusRequest {
	emailFromAuthToken: string;
	userSubjectFromAuthToken: string;
	donationId: number;
}

export interface ClaimDonationRequest {
	emailFromAuthToken: string;
	userSubjectFromAuthToken: string;
	donationId: number;
}

export interface DonationProgressResponse {
	totalDollars: number;
	totalDonations: number;
	totalStorageGb: number;
	goalDollars: number;
	campaignName: string | null;
}

export interface DonationRecord {
	donationid: number;
	accountid: number;
	email: string;
	name: string;
	amount_cents: number;
	amount_dollars: string;
	stripe_customer_id: string | null;
	stripe_charge_id: string | null;
	stripe_payment_intent_id: string | null;
	anonymous: boolean;
	claimed: boolean;
	claimed_at: Date | null;
	client: string | null;
	payment_method_last4: string | null;
	billing_zip: string | null;
	status: string;
	createddt: Date;
	updateddt: Date;
}

export interface WebhookPaymentIntentData {
	paymentIntentId: string;
	customerId: string;
	amount: number;
	paymentMethodId: string | null;
}
