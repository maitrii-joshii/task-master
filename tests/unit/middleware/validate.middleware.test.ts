import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { validateParams } from "../../../src/middleware/validate.middleware";

describe("Validate Params Middleware", () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      params: {},
    } as Request;

    res = {} as Response;
    next = jest.fn();

    jest.clearAllMocks();
  });

  describe("validateParams", () => {
    const schema = z.object({
      id: z.string().uuid(),
    });

    it("should call next when params are valid", () => {
      req.params = {
        id: "550e8400-e29b-41d4-a716-446655440000",
      };

      const middleware = validateParams(schema);

      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it("should call next with an error when params are invalid", () => {
      req.params = {
        id: "invalid-id",
      };

      const middleware = validateParams(schema);

      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);

      const error = (next as jest.Mock).mock.calls[0][0];

      expect(error).toBeInstanceOf(z.ZodError);
    });

    it("should call next with an error when required param is missing", () => {
      req.params = {};

      const middleware = validateParams(schema);

      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);

      const error = (next as jest.Mock).mock.calls[0][0];

      expect(error).toBeInstanceOf(z.ZodError);
    });

    it("should validate params using the provided schema", () => {
      const customSchema = z.object({
        projectId: z.string().min(1),
      });

      req.params = {
        projectId: "project-123",
      };

      const middleware = validateParams(customSchema);

      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it("should not call next without an error when validation fails", () => {
      req.params = {
        id: "not-a-uuid",
      };

      const middleware = validateParams(schema);

      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);

      const firstCall = (next as jest.Mock).mock.calls[0];

      expect(firstCall).toHaveLength(1);
      expect(firstCall[0]).toBeInstanceOf(z.ZodError);
    });
  });
});
