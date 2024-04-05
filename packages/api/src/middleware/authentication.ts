import type { Request, Response, NextFunction } from "express";
import createError from "http-errors";
import { fusionAuthClient } from "../fusionauth";

const emailKey = "email";
const subjectKey = "sub";

const getValueFromAuthToken = async (
  authenticationToken: string,
  key: "email" | "sub",
  applicationId: string
): Promise<string> => {
  const introspectionResponse = await fusionAuthClient.introspectAccessToken(
    applicationId,
    authenticationToken
  );
  if (!introspectionResponse.wasSuccessful()) {
    throw new createError.Unauthorized(
      `Token validation failed: ${
        introspectionResponse.exception.message ?? ""
      }`
    );
  }
  if (
    !introspectionResponse.response.active ||
    typeof introspectionResponse.response[key] !== "string" ||
    introspectionResponse.response[key] === ""
  ) {
    throw new createError.Unauthorized("Invalid token");
  }

  return introspectionResponse.response[key];
};

const getOptionalValueFromAuthToken = async (
  authenticationToken: string,
  key: "email" | "sub",
  applicationId: string
): Promise<string> => {
  const introspectionResponse = await fusionAuthClient.introspectAccessToken(
    applicationId,
    authenticationToken
  );
  if (!introspectionResponse.wasSuccessful()) {
    return "";
  }
  if (
    !introspectionResponse.response.active ||
    typeof introspectionResponse.response[key] !== "string"
  ) {
    return "";
  }

  return introspectionResponse.response[key];
};

const getAuthTokenFromRequest = (
  req: Request<unknown, unknown, unknown>
): string => {
  const authorizationHeaderParts = req.get("Authorization")?.split(" ");
  if (
    !authorizationHeaderParts ||
    authorizationHeaderParts.length !== 2 ||
    authorizationHeaderParts[0] !== "Bearer"
  ) {
    return "";
  }
  return authorizationHeaderParts[1] ?? "";
};

const verifyUserAuthentication = async (
  req: Request<unknown, unknown, { emailFromAuthToken?: string }>,
  _: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authenticationToken = getAuthTokenFromRequest(req);
    if (authenticationToken === "") {
      throw new createError.Unauthorized("Invalid Authorization header format");
    }
    const email = await getValueFromAuthToken(
      authenticationToken,
      emailKey,
      process.env["FUSIONAUTH_BACKEND_APPLICATION_ID"] ?? ""
    );
    req.body.emailFromAuthToken = email;
    next();
  } catch (err) {
    next(err);
  }
};

const verifyAdminAuthentication = async (
  req: Request<unknown, unknown, { emailFromAuthToken?: string }>,
  _: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authenticationToken = getAuthTokenFromRequest(req);
    if (authenticationToken === "") {
      throw new createError.Unauthorized("Invalid Authorization header format");
    }
    const email = await getValueFromAuthToken(
      authenticationToken,
      emailKey,
      process.env["FUSIONAUTH_ADMIN_APPLICATION_ID"] ?? ""
    );
    req.body.emailFromAuthToken = email;
    next();
  } catch (err) {
    next(err);
  }
};

const verifyUserOrAdminAuthentication = async (
  req: Request<
    unknown,
    unknown,
    { userSubjectFromAuthToken?: string; adminSubjectFromAuthToken?: string }
  >,
  _: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authenticationToken = getAuthTokenFromRequest(req);
    if (authenticationToken === "") {
      throw new createError.Unauthorized("Invalid Authorization header format");
    }
    try {
      const subject = await getValueFromAuthToken(
        authenticationToken,
        subjectKey,
        process.env["FUSIONAUTH_BACKEND_APPLICATION_ID"] ?? ""
      );
      req.body.userSubjectFromAuthToken = subject;
      next();
    } catch (err) {
      try {
        const subject = await getValueFromAuthToken(
          authenticationToken,
          subjectKey,
          process.env["FUSIONAUTH_ADMIN_APPLICATION_ID"] ?? ""
        );
        req.body.adminSubjectFromAuthToken = subject;
        next();
      } catch (innerErr) {
        next(innerErr);
      }
    }
  } catch (err) {
    next(err);
  }
};

const extractUserEmailFromAuthToken = async (
  req: Request<unknown, unknown, { emailFromAuthToken?: string }>,
  _: Response,
  next: NextFunction
): Promise<void> => {
  const authenticationToken = getAuthTokenFromRequest(req);
  if (authenticationToken !== "") {
    const email = await getOptionalValueFromAuthToken(
      authenticationToken,
      emailKey,
      process.env["FUSIONAUTH_BACKEND_APPLICATION_ID"] ?? ""
    );
    if (email !== "") {
      req.body.emailFromAuthToken = email;
    }
  }
  next();
};

export {
  verifyUserAuthentication,
  verifyAdminAuthentication,
  verifyUserOrAdminAuthentication,
  extractUserEmailFromAuthToken,
};
