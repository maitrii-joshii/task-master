import { z } from "zod";

export const registerUserSchema = z.object({
  name: z.string().trim().min(3).max(90),
  email: z.string().trim().email(),
  password: z.string().min(6).max(135),
});
