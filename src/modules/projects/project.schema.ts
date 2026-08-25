import { z } from "zod";

export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Project name is required")
    .max(90, "Project name must not exceed 90 characters"),

  description: z
    .string()
    .trim()
    .max(450, "Project description must not exceed 450 characters")
    .optional(),
});

export const updateProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Project name cannot be empty")
    .max(90, "Project name must not exceed 90 characters")
    .optional(),

  description: z
    .string()
    .trim()
    .max(450, "Project description must not exceed 450 characters")
    .nullable()
    .optional(),
});
