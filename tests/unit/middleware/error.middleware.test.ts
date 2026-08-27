import { Request, Response } from "express";
import { ZodError, z } from "zod";
import { errorMiddleware } from "../../../src/middleware/error.middleware";
import { AppError } from "../../../src/utils/appError";

describe("Error Middleware", () => {
  let req: Request;
  let res: Response;

  beforeEach(() => {
    req = {} as Request;

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;

    jest.spyOn(console, "error").mockImplementation(() => {});

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return 400 for ZodError", () => {
    const schema = z.object({
      name: z.string().min(3),
    });

    let error: ZodError;

    try {
      schema.parse({
        name: "A",
      });
    } catch (err) {
      error = err as ZodError;
    }

    errorMiddleware(error!, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: "Validation failed",
        details: error!.issues,
      },
    });

    expect(console.error).not.toHaveBeenCalled();
  });

  it("should return the status code and message for AppError", () => {
    const error = new AppError("Project not found", 404);

    errorMiddleware(error, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: "Project not found",
      },
    });

    expect(console.error).not.toHaveBeenCalled();
  });

  it("should return 500 for an unknown error", () => {
    const error = new Error("Database connection failed");

    errorMiddleware(error, req, res, jest.fn());

    expect(console.error).toHaveBeenCalledWith(error);

    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: "Database connection failed",
      },
    });
  });

  it("should return default message when unknown error has no message", () => {
    const error = {
      message: "",
    };

    errorMiddleware(error, req, res, jest.fn());

    expect(console.error).toHaveBeenCalledWith(error);

    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: "Internal server error",
      },
    });
  });

  it("should set the status before sending the response", () => {
    const error = new AppError("Unauthorized", 401);

    errorMiddleware(error, req, res, jest.fn());

    const statusOrder = (res.status as jest.Mock).mock.invocationCallOrder[0];
    const jsonOrder = (res.json as jest.Mock).mock.invocationCallOrder[0];

    expect(statusOrder).toBeLessThan(jsonOrder);
  });
});
