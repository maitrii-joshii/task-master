import { Response, NextFunction } from "express";

import { AuthenticatedRequest } from "../../../src/middleware/auth.middleware";
import { getUser, updateUser } from "../../../src/modules/users/users.controller";
import { getCurrentUser, updateCurrentUser } from "../../../src/modules/users/users.service";

jest.mock("../../../src/modules/users/users.service", () => ({
  getCurrentUser: jest.fn(),
  updateCurrentUser: jest.fn(),
}));

describe("Users Controller", () => {
  let req: Partial<AuthenticatedRequest>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      body: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    next = jest.fn();

    jest.clearAllMocks();
  });

  describe("getUser", () => {
    it("should return the current user with status 200", async () => {
      const userId = "user-123";

      req = {
        userId,
      };

      const user = {
        id: userId,
        name: "John Doe",
        email: "john@example.com",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (getCurrentUser as jest.Mock).mockResolvedValue(user);

      await getUser(req as AuthenticatedRequest, res as Response, next);

      expect(getCurrentUser).toHaveBeenCalledWith(userId);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: user,
      });

      expect(next).not.toHaveBeenCalled();
    });

    it("should call next when getCurrentUser throws an error", async () => {
      const userId = "user-123";
      const error = new Error("User not found");

      req = {
        userId,
      };

      (getCurrentUser as jest.Mock).mockRejectedValue(error);

      await getUser(req as AuthenticatedRequest, res as Response, next);

      expect(getCurrentUser).toHaveBeenCalledWith(userId);
      expect(next).toHaveBeenCalledWith(error);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe("updateUser", () => {
    it("should update the current user and return status 200", async () => {
      const userId = "user-123";

      req = {
        userId,
        body: {
          name: "John Smith",
        },
      };

      const updatedUser = {
        id: userId,
        name: "John Smith",
        email: "john@example.com",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (updateCurrentUser as jest.Mock).mockResolvedValue(updatedUser);

      await updateUser(req as AuthenticatedRequest, res as Response, next);

      expect(updateCurrentUser).toHaveBeenCalledWith(userId, {
        name: "John Smith",
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: updatedUser,
      });

      expect(next).not.toHaveBeenCalled();
    });

    it("should call next when request body validation fails", async () => {
      req = {
        userId: "user-123",
        body: {
          name: "Jo",
        },
      };

      await updateUser(req as AuthenticatedRequest, res as Response, next);

      expect(updateCurrentUser).not.toHaveBeenCalled();

      expect(next).toHaveBeenCalledTimes(1);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it("should call next when updateCurrentUser throws an error", async () => {
      const userId = "user-123";
      const error = new Error("User not found");

      req = {
        userId,
        body: {
          name: "John Smith",
        },
      };

      (updateCurrentUser as jest.Mock).mockRejectedValue(error);

      await updateUser(req as AuthenticatedRequest, res as Response, next);

      expect(updateCurrentUser).toHaveBeenCalledWith(userId, {
        name: "John Smith",
      });

      expect(next).toHaveBeenCalledWith(error);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it("should allow an empty update object", async () => {
      const userId = "user-123";

      req = {
        userId,
        body: {},
      };

      const user = {
        id: userId,
        name: "John Doe",
        email: "john@example.com",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (updateCurrentUser as jest.Mock).mockResolvedValue(user);

      await updateUser(req as AuthenticatedRequest, res as Response, next);

      expect(updateCurrentUser).toHaveBeenCalledWith(userId, {});

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: user,
      });

      expect(next).not.toHaveBeenCalled();
    });

    it("should reject unknown fields", async () => {
      req = {
        userId: "user-123",
        body: {
          name: "John Smith",
          email: "changed@example.com",
        },
      };

      await updateUser(req as AuthenticatedRequest, res as Response, next);

      expect(updateCurrentUser).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledTimes(1);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
