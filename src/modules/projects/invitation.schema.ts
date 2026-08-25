import { z } from "zod";

export const createInvitationSchema = z.object({
  invitedUserId: z.string().uuid(),
});
