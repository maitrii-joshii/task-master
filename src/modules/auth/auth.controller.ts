import { Request, Response, NextFunction } from "express";
import { registerUserSchema, loginUserSchema, refreshTokenSchema } from "./auth.schema";
import { registerUser, loginUser, refreshAccessToken, logoutUser } from "./auth.service";

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = registerUserSchema.parse(req.body);

    const user = await registerUser(data);

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = loginUserSchema.parse(req.body);

    const result = await loginUser(data);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = refreshTokenSchema.parse(req.body);

    const tokens = await refreshAccessToken(refreshToken);

    res.status(200).json({
      success: true,
      data: tokens,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = refreshTokenSchema.parse(req.body);

    await logoutUser(refreshToken);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
