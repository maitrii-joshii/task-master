import { Request, Response, NextFunction } from "express";
import { registerUserSchema } from "./auth.schema";
import { registerUser } from "./auth.service";

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
