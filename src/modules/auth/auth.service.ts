import prisma from "../../config/prisma";
import { hashPassword, verifyPassword } from "../../utils/password";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../../utils/jwt";
import { hashToken } from "../../utils/token";
import { AppError } from "../../utils/appError";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export const registerUser = async ({ name, email, password }: RegisterInput) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    throw new AppError("User with this email already exists", 409);
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
    },
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
};

interface LoginInput {
  email: string;
  password: string;
}

export const loginUser = async ({ email, password }: LoginInput) => {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isPasswordValid = await verifyPassword(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  if (!user.isActive) {
    throw new AppError("User account is inactive", 403);
  }

  const accessToken = generateAccessToken(user.id);

  const refreshToken = generateRefreshToken(user.id);

  const refreshTokenHash = hashToken(refreshToken);

  const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt: refreshTokenExpiresAt,
    },
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    accessToken,
    refreshToken,
  };
};

export const refreshAccessToken = async (refreshToken: string) => {
  let payload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  if (typeof payload !== "object" || payload === null || !("userId" in payload)) {
    throw new AppError("Invalid refresh token", 401);
  }

  const userId = payload.userId as string;

  const tokenHash = hashToken(refreshToken);

  const storedToken = await prisma.refreshToken.findFirst({
    where: {
      tokenHash,
      userId,
      revokedAt: null,
    },
  });

  if (!storedToken) {
    throw new AppError("Invalid or revoked refresh token", 401);
  }

  if (storedToken.expiresAt < new Date()) {
    throw new AppError("Refresh token expired", 401);
  }

  await prisma.refreshToken.update({
    where: {
      id: storedToken.id,
    },
    data: {
      revokedAt: new Date(),
    },
  });

  const newAccessToken = generateAccessToken(userId);

  const newRefreshToken = generateRefreshToken(userId);

  const newRefreshTokenHash = hashToken(newRefreshToken);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: newRefreshTokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

export const logoutUser = async (refreshToken: string) => {
  const tokenHash = hashToken(refreshToken);

  await prisma.refreshToken.updateMany({
    where: {
      tokenHash,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
};
