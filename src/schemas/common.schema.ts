import { z } from "zod";

export const idParamSchema = z.object({
  id: z.string().uuid("Invalid ID"),
});

export const userIdParamSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
});

export const invitationIdParamSchema = z.object({
  invitationId: z.string().uuid("Invalid invitation ID"),
});

export const projectMemberParamsSchema = z.object({
  id: z.string().uuid("Invalid project ID"),
  userId: z.string().uuid("Invalid user ID"),
});
