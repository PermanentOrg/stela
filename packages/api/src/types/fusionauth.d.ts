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
      token: string
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
  }
}
