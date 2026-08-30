import { z } from "zod";

import { TaskStatus } from "../../generated/prisma/enums";

export const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(90, "Title must not exceed 90 characters"),

  description: z
    .string()
    .trim()
    .max(4500, "Description must not exceed 4500 characters")
    .optional(),

  dueDate: z.string().datetime("Invalid due date").optional(),

  projectId: z.string().uuid("Invalid project ID").optional(),

  assigneeId: z.string().uuid("Invalid assignee ID").optional(),
});

export const updateTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(90, "Title must not exceed 90 characters")
    .optional(),

  description: z
    .string()
    .trim()
    .max(4500, "Description must not exceed 4500 characters")
    .optional(),

  dueDate: z.string().datetime("Invalid due date").optional(),

  assigneeId: z.string().uuid("Invalid assignee ID").nullable().optional(),
});

export const assignTaskSchema = z.object({
  assigneeId: z.string().uuid("Invalid assignee ID"),
});

export const updateTaskStatusSchema = z.object({
  status: z.nativeEnum(TaskStatus),
});

export const taskFilterSchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),

  projectId: z.string().uuid("Invalid project ID").optional(),

  assigneeId: z.string().uuid("Invalid assignee ID").optional(),

  creatorId: z.string().uuid("Invalid creator ID").optional(),

  search: z.string().trim().min(1).optional(),

  sortBy: z.enum(["createdAt", "updatedAt", "dueDate", "title", "status"]).optional(),

  sortOrder: z.enum(["asc", "desc"]).optional(),

  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(10),
});

/**
 * Validate input for AI-generated task description
 */
export const generateTaskDescriptionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(90, "Title must not exceed 90 characters"),
});
