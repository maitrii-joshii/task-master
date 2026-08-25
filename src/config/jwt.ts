import type { SignOptions } from "jsonwebtoken";

const accessSecret = process.env.JWT_ACCESS_SECRET;
const refreshSecret = process.env.JWT_REFRESH_SECRET;

if (!accessSecret || !refreshSecret) {
  throw new Error("JWT secrets are not configured");
}

export const jwtConfig: {
  accessSecret: string;
  refreshSecret: string;
  accessExpiresIn: SignOptions["expiresIn"];
  refreshExpiresIn: SignOptions["expiresIn"];
} = {
  accessSecret,
  refreshSecret,
  accessExpiresIn: "15m",
  refreshExpiresIn: "7d",
};
