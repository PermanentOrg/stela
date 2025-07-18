declare module "@fusionauth/typescript-client" {
	export interface Error {
		code?: string;
		data?: Record<string, string>;
		message?: string;
	}
	export declare class FusionAuthClient {
		public constructor(apiKey: string, host: string, tenantId: string);
		public introspectAccessToken(
			applicationId: string,
			token: string,
		): Promise<{
			statusCode: number;
			response:
				| {
						active: true;
						applicationId: string;
						aud: string;
						auth_time: number;
						authenticationType: string;
						email: string;
						email_verified: boolean;
						exp: number;
						iat: number;
						iss: string;
						jti: string;
						roles: string[];
						sub: string;
						tid: string;
				  }
				| { active: false };
			exception: Error;
			wasSuccessful: () => boolean;
		}>;
		public retrieveUserByEmail(email: string): Promise<{
			response: {
				user: {
					twoFactor: {
						methods: Array<{
							id: string;
							method: string;
							email: string;
							mobilePhone: string;
						}>;
					};
				};
			};
			exception: Error;
			wasSuccessful: () => boolean;
		}>;
		public enableTwoFactor(
			userId: string,
			request: {
				applicationId?: UUID;
				code?: string;
				email?: string;
				method?: string;
				mobilePhone?: string;
				twoFactorId?: string;
			},
		): Promise<{
			statusCode: number;
			response: {
				code?: string;
				recoveryCodes?: string[];
			};
			exception: Error;
			wasSuccessful: () => boolean;
		}>;
		public sendTwoFactorCodeForEnableDisable(request: {
			email?: string;
			method?: string;
			methodId?: string;
			mobilePhone?: string;
			userId?: string;
		}): Promise<{
			statusCode: number;
			exception: Error;
			wasSuccessful: () => boolean;
		}>;
		public disableTwoFactor(
			userId: string,
			methodId: string,
			code: string,
		): Promise<{
			statusCode: number;
			exception: Error;
			wasSuccessful: () => boolean;
		}>;
	}
}
