import type { RequestHandler, Request, Response, NextFunction } from "express";
import createError from "http-errors";
import { fusionAuthClient } from "../fusionauth";
import { logger } from "../log";

const buildAuthenticationVerifier =
  (
    applicationId: string
  ): RequestHandler<unknown, unknown, { emailFromAuthToken?: string }> =>
  async (
    req: Request<unknown, unknown, { emailFromAuthToken?: string }>,
    _: Response,
    next: NextFunction
  ): Promise<void> => {
    logger.info("Start auth token validation");
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
    logger.info("Extract auth token from header");

    try {
      logger.info("Calling fusionauth");
      const introspectionResponse =
        await fusionAuthClient.introspectAccessToken(
          applicationId,
          authenticationToken ?? ""
        );
      logger.info("Received response from fusionauth");
      if (!introspectionResponse.wasSuccessful()) {
        logger.info("Token validation failed");
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
        logger.info("Invalid token");
        next(new createError.Unauthorized("Invalid token"));
        return;
      }

      logger.info("Extracting email from token");
      req.body.emailFromAuthToken = introspectionResponse.response["email"];
      logger.info("Validated auth token");
    } catch (err) {
      next(err);
    }
    next();
  };

const verifyUserAuthentication = buildAuthenticationVerifier(
  process.env["FUSIONAUTH_BACKEND_APPLICATION_ID"] ?? ""
);
const verifyAdminAuthentication = buildAuthenticationVerifier(
  process.env["FUSIONAUTH_ADMIN_APPLICATION_ID"] ?? ""
);

export { verifyUserAuthentication, verifyAdminAuthentication };
