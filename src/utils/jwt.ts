import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { jwtConfig } from "../config/jwt";

export const generateAccessToken = (userId: string): string => {
  return jwt.sign(
    {
      userId,
    },
    jwtConfig.accessSecret,
    {
      expiresIn: jwtConfig.accessExpiresIn,
    }
  );
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign(
    {
      userId,
      jti: randomUUID(),
    },
    jwtConfig.refreshSecret,
    {
      expiresIn: jwtConfig.refreshExpiresIn,
    }
  );
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, jwtConfig.accessSecret);
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, jwtConfig.refreshSecret);
};
