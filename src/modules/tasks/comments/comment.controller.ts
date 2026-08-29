import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../../middleware/auth.middleware";

import {
  createComment,
  getTaskComments,
  getCommentById,
  updateComment,
  deleteComment,
} from "./comment.service";

import { createCommentSchema, updateCommentSchema } from "./comment.schema";

export const createCommentController = async (
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

    const { content } = createCommentSchema.parse(req.body);

    const comment = await createComment(taskId, userId, content);

    res.status(201).json({
      success: true,
      data: comment,
    });
  } catch (error) {
    next(error);
  }
};

export const getTaskCommentsController = async (
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

    const comments = await getTaskComments(taskId, userId);

    res.status(200).json({
      success: true,
      data: comments,
    });
  } catch (error) {
    next(error);
  }
};

export const getCommentByIdController = async (
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
    const commentId = req.params.commentId as string;

    const comment = await getCommentById(taskId, commentId, userId);

    res.status(200).json({
      success: true,
      data: comment,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCommentController = async (
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
    const commentId = req.params.commentId as string;

    const { content } = updateCommentSchema.parse(req.body);

    const comment = await updateComment(taskId, commentId, userId, content);

    res.status(200).json({
      success: true,
      data: comment,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCommentController = async (
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
    const commentId = req.params.commentId as string;

    await deleteComment(taskId, commentId, userId);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
