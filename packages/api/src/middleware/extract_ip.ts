import type { Request, Response, NextFunction } from "express";

export const extractIp = (
  req: Request<unknown, unknown, Record<string, string | undefined>>,
  _: Response,
  next: NextFunction
): void => {
  req.body["ip"] = req.get("x-forwarded-for") ?? req.connection.remoteAddress;
  next();
};
