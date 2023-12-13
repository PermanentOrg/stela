export interface GiftStorageRequest {
  emailFromAuthToken: string;
  storageAmount: number;
  recipientEmails: string[];
  note: string;
}

export interface GiftStorageResponse {
  storageGifted: number;
  giftDelivered: string[];
  invitationSent: string[];
  alreadyInvited: string[];
}
