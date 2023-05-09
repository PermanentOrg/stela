import type { Request, Response, NextFunction } from "express";
import type { HttpError } from "http-errors";

const isHttpError = (err: unknown): err is HttpError =>
  !!(err as HttpError).statusCode;

export const handleHttpError = async (
  err: unknown,
  _: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (isHttpError(err)) {
    res.status(err.statusCode).json({ error: err });
  } else {
    next(err);
  }
};
