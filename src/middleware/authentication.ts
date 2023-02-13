import type { RequestHandler, Request, Response, NextFunction } from "express";
import createError from "http-errors";
import { fusionAuthClient } from "../fusionauth";

const buildAuthenticationVerifier =
  (
    applicationId: string
  ): RequestHandler<unknown, unknown, { emailFromAuthToken?: string }> =>
  async (
    req: Request<unknown, unknown, { emailFromAuthToken?: string }>,
    _: Response,
    next: NextFunction
  ): Promise<void> => {
    const authorizationHeaderParts = req.get("Authorization")?.split(" ");
    if (
      !authorizationHeaderParts ||
      authorizationHeaderParts.length !== 2 ||
      authorizationHeaderParts[0] !== "Bearer"
    ) {
      next(new createError.Unauthorized("Invalid Authorization header format"));
      return;
    }
    const authenticationToken = authorizationHeaderParts[1];

    const introspectionResponse = await fusionAuthClient.introspectAccessToken(
      applicationId,
      authenticationToken ?? ""
    );
    if (!introspectionResponse.wasSuccessful()) {
      next(
        new createError.Unauthorized(
          `Token validation failed: ${introspectionResponse.exception.message}`
        )
      );
      return;
    }
    if (
      introspectionResponse.response["active"] !== true ||
      typeof introspectionResponse.response["email"] !== "string" ||
      introspectionResponse.response["email"] === ""
    ) {
      next(new createError.Unauthorized("Invalid token"));
      return;
    }

    req.body.emailFromAuthToken = introspectionResponse.response["email"];
    next();
  };

const verifyUserAuthentication = buildAuthenticationVerifier(
  process.env["FUSIONAUTH_BACKEND_APPLICATION_ID"] ?? ""
);
const verifyAdminAuthentication = buildAuthenticationVerifier(
  process.env["FUSIONAUTH_ADMIN_APPLICATION_ID"] ?? ""
);

export { verifyUserAuthentication, verifyAdminAuthentication };
