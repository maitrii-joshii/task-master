import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../../middleware/auth.middleware";

import {
  uploadAttachment,
  getTaskAttachments,
  getAttachmentById,
  deleteAttachment,
} from "./attachment.service";

export const uploadAttachmentController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
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

    const taskId = req.params.taskId as string;

    if (!req.file) {
      res.status(400).json({
        success: false,
        error: {
          message: "File is required",
        },
      });
      return;
    }

    const attachment = await uploadAttachment(taskId, userId, req.file);

    res.status(201).json({
      success: true,
      data: attachment,
    });
  } catch (error) {
    next(error);
  }
};

export const getTaskAttachmentsController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
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

    const taskId = req.params.taskId as string;

    const attachments = await getTaskAttachments(taskId, userId);

    res.status(200).json({
      success: true,
      data: attachments,
    });
  } catch (error) {
    next(error);
  }
};

export const getAttachmentByIdController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
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

    const taskId = req.params.taskId as string;
    const attachmentId = req.params.attachmentId as string;

    const attachment = await getAttachmentById(taskId, attachmentId, userId);

    res.status(200).json({
      success: true,
      data: attachment,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAttachmentController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
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

    const taskId = req.params.taskId as string;
    const attachmentId = req.params.attachmentId as string;

    await deleteAttachment(taskId, attachmentId, userId);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
