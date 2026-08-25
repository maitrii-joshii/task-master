import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { AppError } from "../utils/appError";

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export const authenticate = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization) {
      throw new AppError("Authentication required", 401);
    }

    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw new AppError("Invalid authorization header", 401);
    }

    const payload = verifyAccessToken(token);

    if (typeof payload !== "object" || payload === null || !("userId" in payload)) {
      throw new AppError("Invalid access token", 401);
    }

    req.userId = payload.userId as string;

    next();
  } catch (error) {
    next(error instanceof AppError ? error : new AppError("Invalid or expired access token", 401));
  }
};
