import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/appError";

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        message: "Validation failed",
        details: error.issues,
      },
    });

    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        message: error.message,
      },
    });

    return;
  }

  console.error(error);

  res.status(500).json({
    success: false,
    error: {
      message: error.message || "Internal server error",
    },
  });
};
