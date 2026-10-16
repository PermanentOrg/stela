export interface TwoFactorRequestResponse {
	methodId: string;
	method: string;
	value: string;
}

export interface SendEnableCodeRequest {
	method: TwoFactorMethod;
	value: string;
}

export interface CreateTwoFactorMethodRequest {
	code: string;
	method: TwoFactorMethod;
	value: string;
}

export interface SendDisableCodeRequest {
	methodId: string;
}

export interface DisableTwoFactorRequest {
	methodId: string;
	code: string;
}

export enum TwoFactorMethod {
	Email = "email",
	Sms = "sms",
}
