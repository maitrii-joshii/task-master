import { NextFunction, Response } from "express";
import { authenticate, AuthenticatedRequest } from "../../../src/middleware/auth.middleware";
import { verifyAccessToken } from "../../../src/utils/jwt";
import { AppError } from "../../../src/utils/appError";

jest.mock("../../../src/utils/jwt", () => ({
  verifyAccessToken: jest.fn(),
}));

describe("Auth Middleware", () => {
  let req: AuthenticatedRequest;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      headers: {},
    } as AuthenticatedRequest;

    res = {} as Response;
    next = jest.fn();

    jest.clearAllMocks();
  });

  describe("authenticate", () => {
    it("should return 401 when authorization header is missing", () => {
      authenticate(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));

      const error = (next as jest.Mock).mock.calls[0][0];

      expect(error.message).toBe("Authentication required");
      expect(error.statusCode).toBe(401);
    });

    it("should return 401 when authorization header has invalid scheme", () => {
      req.headers.authorization = "Basic some-token";

      authenticate(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);

      const error = (next as jest.Mock).mock.calls[0][0];

      expect(error.message).toBe("Invalid authorization header");
      expect(error.statusCode).toBe(401);
    });

    it("should return 401 when Bearer token is missing", () => {
      req.headers.authorization = "Bearer";

      authenticate(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);

      const error = (next as jest.Mock).mock.calls[0][0];

      expect(error.message).toBe("Invalid authorization header");
      expect(error.statusCode).toBe(401);
    });

    it("should call next with 401 when access token is invalid", () => {
      req.headers.authorization = "Bearer invalid-token";

      (verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw new Error("Invalid token");
      });

      authenticate(req, res, next);

      expect(verifyAccessToken).toHaveBeenCalledWith("invalid-token");
      expect(next).toHaveBeenCalledTimes(1);

      const error = (next as jest.Mock).mock.calls[0][0];

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe("Invalid or expired access token");
      expect(error.statusCode).toBe(401);
    });

    it("should return 401 when token payload does not contain userId", () => {
      req.headers.authorization = "Bearer valid-token";

      (verifyAccessToken as jest.Mock).mockReturnValue({
        email: "test@example.com",
      });

      authenticate(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);

      const error = (next as jest.Mock).mock.calls[0][0];

      expect(error.message).toBe("Invalid access token");
      expect(error.statusCode).toBe(401);
    });

    it("should authenticate the user when token is valid", () => {
      req.headers.authorization = "Bearer valid-token";

      (verifyAccessToken as jest.Mock).mockReturnValue({
        userId: "user-123",
      });

      authenticate(req, res, next);

      expect(verifyAccessToken).toHaveBeenCalledWith("valid-token");
      expect(req.userId).toBe("user-123");
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it("should convert non-AppError exceptions into an AppError", () => {
      req.headers.authorization = "Bearer valid-token";

      (verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw new Error("JWT verification failed");
      });

      authenticate(req, res, next);

      const error = (next as jest.Mock).mock.calls[0][0];

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe("Invalid or expired access token");
      expect(error.statusCode).toBe(401);
    });

    it("should preserve AppError thrown by the middleware", () => {
      req.headers.authorization = "Bearer valid-token";

      const appError = new AppError("Custom authentication error", 403);

      (verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw appError;
      });

      authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith(appError);
    });
  });
});
