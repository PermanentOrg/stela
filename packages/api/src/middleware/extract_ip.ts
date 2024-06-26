import type { Request, Response, NextFunction } from "express";

const extractClientIpFromProxyList = (
  list: string | undefined
): string | undefined => {
  if (typeof list !== "undefined") {
    if (list.includes(",")) {
      return list.split(",").shift()?.trim();
    }
  }
  return list;
};

export const extractIp = (
  req: Request<unknown, unknown, Record<string, string | undefined>>,
  _: Response,
  next: NextFunction
): void => {
  req.body["ip"] =
    extractClientIpFromProxyList(req.get("X-Forwarded-For")) ??
    req.connection.remoteAddress;
  next();
};
