import { z } from "zod";

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(3).max(90).optional(),
  })
  .strict();
