import { Response, NextFunction } from "express";
import { ProjectMemberRole } from "../generated/prisma/enums";
import prisma from "../config/prisma";
import { AuthenticatedRequest } from "./auth.middleware";

export const requireProjectRole = (allowedRoles: ProjectMemberRole[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const projectId = req.params.id as string;
      const userId = req.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            message: "Authentication required",
          },
        });
        return;
      }

      const membership = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId,
          },
        },
      });

      if (!membership) {
        res.status(403).json({
          success: false,
          error: {
            message: "You are not a member of this project",
          },
        });
        return;
      }

      if (!allowedRoles.includes(membership.role)) {
        res.status(403).json({
          success: false,
          error: {
            message: "You are not authorized to perform this action",
          },
        });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
