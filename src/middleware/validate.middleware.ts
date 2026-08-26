import { Request, Response, NextFunction } from "express";
import { z } from "zod";

export const validateParams = (schema: z.ZodType) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.params);
      next();
    } catch (error) {
      next(error);
    }
  };
};
