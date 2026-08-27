import prisma from "../../../src/config/prisma";

import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
} from "../../../src/modules/auth/auth.service";

import { hashPassword, verifyPassword } from "../../../src/utils/password";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../../src/utils/jwt";
import { hashToken } from "../../../src/utils/token";

jest.mock("../../../src/config/prisma", () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

jest.mock("../../../src/utils/password", () => ({
  hashPassword: jest.fn(),
  verifyPassword: jest.fn(),
}));

jest.mock("../../../src/utils/jwt", () => ({
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
}));

jest.mock("../../../src/utils/token", () => ({
  hashToken: jest.fn(),
}));

describe("Auth Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("registerUser", () => {
    it("should register a new user successfully", async () => {
      const createdAt = new Date();

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      (hashPassword as jest.Mock).mockResolvedValue("hashed-password");

      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: "user-123",
        name: "John Doe",
        email: "john@example.com",
        passwordHash: "hashed-password",
        createdAt,
      });

      const result = await registerUser({
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: {
          email: "john@example.com",
        },
      });

      expect(hashPassword).toHaveBeenCalledWith("password123");

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          name: "John Doe",
          email: "john@example.com",
          passwordHash: "hashed-password",
        },
      });

      expect(result).toEqual({
        id: "user-123",
        name: "John Doe",
        email: "john@example.com",
        createdAt,
      });
    });

    it("should throw an error when email already exists", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "existing-user",
        email: "john@example.com",
      });

      await expect(
        registerUser({
          name: "John Doe",
          email: "john@example.com",
          password: "password123",
        })
      ).rejects.toMatchObject({
        message: "User with this email already exists",
        statusCode: 409,
      });

      expect(hashPassword).not.toHaveBeenCalled();
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe("loginUser", () => {
    const user = {
      id: "user-123",
      name: "John Doe",
      email: "john@example.com",
      passwordHash: "hashed-password",
      isActive: true,
    };

    it("should login successfully with valid credentials", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);

      (verifyPassword as jest.Mock).mockResolvedValue(true);

      (generateAccessToken as jest.Mock).mockReturnValue("access-token");

      (generateRefreshToken as jest.Mock).mockReturnValue("refresh-token");

      (hashToken as jest.Mock).mockReturnValue("refresh-token-hash");

      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({
        id: "refresh-token-id",
      });

      const result = await loginUser({
        email: "john@example.com",
        password: "password123",
      });

      expect(verifyPassword).toHaveBeenCalledWith("password123", "hashed-password");

      expect(generateAccessToken).toHaveBeenCalledWith("user-123");

      expect(generateRefreshToken).toHaveBeenCalledWith("user-123");

      expect(hashToken).toHaveBeenCalledWith("refresh-token");

      expect(prisma.refreshToken.create).toHaveBeenCalled();

      expect(result).toEqual({
        user: {
          id: "user-123",
          name: "John Doe",
          email: "john@example.com",
        },
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });
    });

    it("should reject login when user does not exist", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        loginUser({
          email: "john@example.com",
          password: "wrong-password",
        })
      ).rejects.toMatchObject({
        message: "Invalid email or password",
        statusCode: 401,
      });

      expect(verifyPassword).not.toHaveBeenCalled();
    });

    it("should reject login when password is incorrect", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);

      (verifyPassword as jest.Mock).mockResolvedValue(false);

      await expect(
        loginUser({
          email: "john@example.com",
          password: "wrong-password",
        })
      ).rejects.toMatchObject({
        message: "Invalid email or password",
        statusCode: 401,
      });

      expect(generateAccessToken).not.toHaveBeenCalled();
      expect(generateRefreshToken).not.toHaveBeenCalled();
      expect(prisma.refreshToken.create).not.toHaveBeenCalled();
    });

    it("should reject login when user account is inactive", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...user,
        isActive: false,
      });

      (verifyPassword as jest.Mock).mockResolvedValue(true);

      await expect(
        loginUser({
          email: "john@example.com",
          password: "password123",
        })
      ).rejects.toMatchObject({
        message: "User account is inactive",
        statusCode: 403,
      });

      expect(generateAccessToken).not.toHaveBeenCalled();
      expect(generateRefreshToken).not.toHaveBeenCalled();
      expect(prisma.refreshToken.create).not.toHaveBeenCalled();
    });
  });

  describe("refreshAccessToken", () => {
    it("should refresh tokens successfully", async () => {
      const refreshToken = "old-refresh-token";

      (verifyRefreshToken as jest.Mock).mockReturnValue({
        userId: "user-123",
      });

      (hashToken as jest.Mock).mockReturnValue("hashed-refresh-token");

      (prisma.refreshToken.findFirst as jest.Mock).mockResolvedValue({
        id: "stored-token-id",
        userId: "user-123",
        tokenHash: "hashed-refresh-token",
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
      });

      (prisma.refreshToken.update as jest.Mock).mockResolvedValue({});

      (generateAccessToken as jest.Mock).mockReturnValue("new-access-token");

      (generateRefreshToken as jest.Mock).mockReturnValue("new-refresh-token");

      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});

      (hashToken as jest.Mock)
        .mockReturnValueOnce("hashed-refresh-token")
        .mockReturnValueOnce("new-refresh-token-hash");

      const result = await refreshAccessToken(refreshToken);

      expect(verifyRefreshToken).toHaveBeenCalledWith(refreshToken);

      expect(prisma.refreshToken.findFirst).toHaveBeenCalledWith({
        where: {
          tokenHash: "hashed-refresh-token",
          userId: "user-123",
          revokedAt: null,
        },
      });

      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: {
          id: "stored-token-id",
        },
        data: {
          revokedAt: expect.any(Date),
        },
      });

      expect(generateAccessToken).toHaveBeenCalledWith("user-123");

      expect(generateRefreshToken).toHaveBeenCalledWith("user-123");

      expect(prisma.refreshToken.create).toHaveBeenCalled();

      expect(result).toEqual({
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
      });
    });

    it("should reject an invalid refresh token", async () => {
      (verifyRefreshToken as jest.Mock).mockImplementation(() => {
        throw new Error("Invalid token");
      });

      await expect(refreshAccessToken("invalid-token")).rejects.toMatchObject({
        message: "Invalid or expired refresh token",
        statusCode: 401,
      });

      expect(prisma.refreshToken.findFirst).not.toHaveBeenCalled();
    });

    it("should reject a revoked or missing refresh token", async () => {
      (verifyRefreshToken as jest.Mock).mockReturnValue({
        userId: "user-123",
      });

      (hashToken as jest.Mock).mockReturnValue("hashed-refresh-token");

      (prisma.refreshToken.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(refreshAccessToken("refresh-token")).rejects.toMatchObject({
        message: "Invalid or revoked refresh token",
        statusCode: 401,
      });

      expect(prisma.refreshToken.update).not.toHaveBeenCalled();
      expect(generateAccessToken).not.toHaveBeenCalled();
    });

    it("should reject an expired refresh token", async () => {
      (verifyRefreshToken as jest.Mock).mockReturnValue({
        userId: "user-123",
      });

      (hashToken as jest.Mock).mockReturnValue("hashed-refresh-token");

      (prisma.refreshToken.findFirst as jest.Mock).mockResolvedValue({
        id: "stored-token-id",
        userId: "user-123",
        tokenHash: "hashed-refresh-token",
        revokedAt: null,
        expiresAt: new Date(Date.now() - 60_000),
      });

      await expect(refreshAccessToken("refresh-token")).rejects.toMatchObject({
        message: "Refresh token expired",
        statusCode: 401,
      });

      expect(prisma.refreshToken.update).not.toHaveBeenCalled();
      expect(generateAccessToken).not.toHaveBeenCalled();
    });
  });

  describe("logoutUser", () => {
    it("should revoke the refresh token successfully", async () => {
      (hashToken as jest.Mock).mockReturnValue("hashed-refresh-token");

      (prisma.refreshToken.updateMany as jest.Mock).mockResolvedValue({
        count: 1,
      });

      await logoutUser("refresh-token");

      expect(hashToken).toHaveBeenCalledWith("refresh-token");

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          tokenHash: "hashed-refresh-token",
          revokedAt: null,
        },
        data: {
          revokedAt: expect.any(Date),
        },
      });
    });
  });
});
