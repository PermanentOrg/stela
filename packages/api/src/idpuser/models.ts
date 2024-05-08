/** @format */

export interface TwoFactorRequest {
  emailFromAuthToken: string;
}

export interface TwoFactorRequestResponse {
  methodId: string;
  method: string;
  value: string;
}
