import { Request, Response, NextFunction } from "express";
import { createInvitation, acceptInvitation, rejectInvitation } from "./invitation.service";
import { AuthenticatedRequest } from "../../middleware/auth.middleware";

export const createInvitationController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;
    const projectId = req.params.id as string;

    const invitation = await createInvitation(projectId, userId, req.body);

    res.status(201).json({
      success: true,
      data: invitation,
    });
  } catch (error) {
    next(error);
  }
};

export const acceptInvitationController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;
    const invitationId = req.params.invitationId as string;

    const result = await acceptInvitation(invitationId, userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const rejectInvitationController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;
    const invitationId = req.params.invitationId as string;

    const invitation = await rejectInvitation(invitationId, userId);

    res.status(200).json({
      success: true,
      data: invitation,
    });
  } catch (error) {
    next(error);
  }
};
