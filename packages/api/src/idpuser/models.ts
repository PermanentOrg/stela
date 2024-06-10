export interface TwoFactorRequestResponse {
  methodId: string;
  method: string;
  value: string;
}

export interface SendEnableCodeRequest {
  emailFromAuthToken: string;
  method: TwoFactorMethod;
  value: string;
}

export interface CreateTwoFactorMethodRequest {
  emailFromAuthToken: string;
  code: string;
  method: TwoFactorMethod;
  value: string;
}

export enum TwoFactorMethod {
  Email = "email",
  Sms = "sms",
}
