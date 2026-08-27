import { Response, NextFunction } from "express";
import { ProjectMemberRole } from "../../../src/generated/prisma/enums";
import prisma from "../../../src/config/prisma";
import { requireProjectRole } from "../../../src/middleware/projectAuthorization.middleware";
import { AuthenticatedRequest } from "../../../src/middleware/auth.middleware";

jest.mock("../../../src/config/prisma", () => ({
  __esModule: true,
  default: {
    projectMember: {
      findUnique: jest.fn(),
    },
  },
}));

describe("Project Authorization Middleware", () => {
  let req: AuthenticatedRequest;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      params: {
        id: "project-123",
      },
      userId: "user-123",
    } as unknown as AuthenticatedRequest;

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;

    next = jest.fn();
  });

  describe("requireProjectRole", () => {
    it("should return 401 when userId is missing", async () => {
      req.userId = undefined;

      const middleware = requireProjectRole([ProjectMemberRole.OWNER]);

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: "Authentication required",
        },
      });

      expect(prisma.projectMember.findUnique).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 403 when user is not a project member", async () => {
      (prisma.projectMember.findUnique as jest.Mock).mockResolvedValue(null);

      const middleware = requireProjectRole([ProjectMemberRole.OWNER]);

      await middleware(req, res, next);

      expect(prisma.projectMember.findUnique).toHaveBeenCalledWith({
        where: {
          projectId_userId: {
            projectId: "project-123",
            userId: "user-123",
          },
        },
      });

      expect(res.status).toHaveBeenCalledWith(403);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: "You are not a member of this project",
        },
      });

      expect(next).not.toHaveBeenCalled();
    });

    it("should return 403 when user does not have an allowed role", async () => {
      (prisma.projectMember.findUnique as jest.Mock).mockResolvedValue({
        projectId: "project-123",
        userId: "user-123",
        role: ProjectMemberRole.MEMBER,
      });

      const middleware = requireProjectRole([ProjectMemberRole.OWNER]);

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: "You are not authorized to perform this action",
        },
      });

      expect(next).not.toHaveBeenCalled();
    });

    it("should call next when user has an allowed role", async () => {
      (prisma.projectMember.findUnique as jest.Mock).mockResolvedValue({
        projectId: "project-123",
        userId: "user-123",
        role: ProjectMemberRole.OWNER,
      });

      const middleware = requireProjectRole([ProjectMemberRole.OWNER]);

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it("should call next when user role is one of multiple allowed roles", async () => {
      (prisma.projectMember.findUnique as jest.Mock).mockResolvedValue({
        projectId: "project-123",
        userId: "user-123",
        role: ProjectMemberRole.MEMBER,
      });

      const middleware = requireProjectRole([ProjectMemberRole.OWNER, ProjectMemberRole.MEMBER]);

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it("should pass database errors to next", async () => {
      const error = new Error("Database connection failed");

      (prisma.projectMember.findUnique as jest.Mock).mockRejectedValue(error);

      const middleware = requireProjectRole([ProjectMemberRole.OWNER]);

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
