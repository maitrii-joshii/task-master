import { Request, Response, NextFunction } from "express";

import { register, login, refresh, logout } from "../../../src/modules/auth/auth.controller";

import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
} from "../../../src/modules/auth/auth.service";

jest.mock("../../../src/modules/auth/auth.service", () => ({
  registerUser: jest.fn(),
  loginUser: jest.fn(),
  refreshAccessToken: jest.fn(),
  logoutUser: jest.fn(),
}));

describe("Auth Controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      body: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    next = jest.fn();

    jest.clearAllMocks();
  });

  describe("register", () => {
    it("should register a user and return 201", async () => {
      req.body = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      };

      const user = {
        id: "user-123",
        name: "John Doe",
        email: "john@example.com",
        createdAt: new Date(),
      };

      (registerUser as jest.Mock).mockResolvedValue(user);

      await register(req as Request, res as Response, next);

      expect(registerUser).toHaveBeenCalledWith({
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      });

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: user,
      });

      expect(next).not.toHaveBeenCalled();
    });

    it("should call next when request body validation fails", async () => {
      req.body = {
        name: "Jo",
        email: "invalid-email",
        password: "123",
      };

      await register(req as Request, res as Response, next);

      expect(registerUser).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it("should call next when registerUser throws an error", async () => {
      req.body = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      };

      const error = new Error("User already exists");

      (registerUser as jest.Mock).mockRejectedValue(error);

      await register(req as Request, res as Response, next);

      expect(registerUser).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("login", () => {
    it("should login a user and return 200", async () => {
      req.body = {
        email: "john@example.com",
        password: "password123",
      };

      const result = {
        user: {
          id: "user-123",
          name: "John Doe",
          email: "john@example.com",
        },
        accessToken: "access-token",
        refreshToken: "refresh-token",
      };

      (loginUser as jest.Mock).mockResolvedValue(result);

      await login(req as Request, res as Response, next);

      expect(loginUser).toHaveBeenCalledWith({
        email: "john@example.com",
        password: "password123",
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: result,
      });

      expect(next).not.toHaveBeenCalled();
    });

    it("should call next when request body validation fails", async () => {
      req.body = {
        email: "invalid-email",
        password: "",
      };

      await login(req as Request, res as Response, next);

      expect(loginUser).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should call next when loginUser throws an error", async () => {
      req.body = {
        email: "john@example.com",
        password: "wrong-password",
      };

      const error = new Error("Invalid email or password");

      (loginUser as jest.Mock).mockRejectedValue(error);

      await login(req as Request, res as Response, next);

      expect(loginUser).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("refresh", () => {
    it("should refresh tokens and return 200", async () => {
      req.body = {
        refreshToken: "valid-refresh-token",
      };

      const tokens = {
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
      };

      (refreshAccessToken as jest.Mock).mockResolvedValue(tokens);

      await refresh(req as Request, res as Response, next);

      expect(refreshAccessToken).toHaveBeenCalledWith("valid-refresh-token");

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: tokens,
      });

      expect(next).not.toHaveBeenCalled();
    });

    it("should call next when refresh token validation fails", async () => {
      req.body = {
        refreshToken: "",
      };

      await refresh(req as Request, res as Response, next);

      expect(refreshAccessToken).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should call next when refreshAccessToken throws an error", async () => {
      req.body = {
        refreshToken: "invalid-refresh-token",
      };

      const error = new Error("Invalid or expired refresh token");

      (refreshAccessToken as jest.Mock).mockRejectedValue(error);

      await refresh(req as Request, res as Response, next);

      expect(refreshAccessToken).toHaveBeenCalledWith("invalid-refresh-token");
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("logout", () => {
    it("should logout the user and return 204", async () => {
      req.body = {
        refreshToken: "valid-refresh-token",
      };

      (logoutUser as jest.Mock).mockResolvedValue(undefined);

      await logout(req as Request, res as Response, next);

      expect(logoutUser).toHaveBeenCalledWith("valid-refresh-token");

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();

      expect(next).not.toHaveBeenCalled();
    });

    it("should call next when refresh token validation fails", async () => {
      req.body = {
        refreshToken: "",
      };

      await logout(req as Request, res as Response, next);

      expect(logoutUser).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should call next when logoutUser throws an error", async () => {
      req.body = {
        refreshToken: "invalid-refresh-token",
      };

      const error = new Error("Logout failed");

      (logoutUser as jest.Mock).mockRejectedValue(error);

      await logout(req as Request, res as Response, next);

      expect(logoutUser).toHaveBeenCalledWith("invalid-refresh-token");
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
