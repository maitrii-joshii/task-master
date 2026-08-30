import { Response, NextFunction } from "express";

import {
  createTask,
  getTaskById,
  getTasks,
  updateTask,
  deleteTask,
  assignTask,
  updateTaskStatus,
} from "./task.service";

import {
  createTaskSchema,
  updateTaskSchema,
  assignTaskSchema,
  updateTaskStatusSchema,
  taskFilterSchema,
  generateTaskDescriptionSchema,
} from "./task.schema";

import { AuthenticatedRequest } from "../../middleware/auth.middleware";
import { generateTaskDescription } from "../../services/ai";

/**
 * Create task
 */
export const createTaskController = async (
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

    const input = createTaskSchema.parse(req.body);

    const task = await createTask(userId, input);

    res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate task description using AI
 */
export const generateTaskDescriptionController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // -----------------------------------------
    // Check authentication
    // -----------------------------------------

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

    // -----------------------------------------
    // Validate request
    // -----------------------------------------

    const { title } = generateTaskDescriptionSchema.parse(req.body);

    // -----------------------------------------
    // Generate description using AI
    // -----------------------------------------

    const description = await generateTaskDescription(title);

    // -----------------------------------------
    // Return generated description
    // -----------------------------------------

    res.status(200).json({
      success: true,
      data: {
        title,
        description,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get task by ID
 */
export const getTaskByIdController = async (
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

    const taskId = req.params.id as string;

    const task = await getTaskById(taskId, userId);

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get tasks
 */
export const getTasksController = async (
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

    const filters = taskFilterSchema.parse(req.query);

    const result = await getTasks(userId, filters);

    res.status(200).json({
      success: true,
      data: result.tasks,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update task
 */
export const updateTaskController = async (
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

    const taskId = req.params.id as string;

    const input = updateTaskSchema.parse(req.body);

    const task = await updateTask(taskId, userId, input);

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete task
 */
export const deleteTaskController = async (
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

    const taskId = req.params.id as string;

    await deleteTask(taskId, userId);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

/**
 * Assign task
 */
export const assignTaskController = async (
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

    const taskId = req.params.id as string;

    const { assigneeId } = assignTaskSchema.parse(req.body);

    const task = await assignTask(taskId, userId, assigneeId);

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update task status
 */
export const updateTaskStatusController = async (
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

    const taskId = req.params.id as string;

    const { status } = updateTaskStatusSchema.parse(req.body);

    const task = await updateTaskStatus(taskId, userId, status);

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};
