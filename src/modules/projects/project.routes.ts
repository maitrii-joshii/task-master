import { Router } from "express";
import {
  createProjectController,
  updateProjectController,
  getProjectByIdController,
  getProjectsController,
  deleteProjectController,
  getProjectMembersController,
  removeProjectMemberController,
} from "./project.controller";
import {
  createInvitationController,
  acceptInvitationController,
  rejectInvitationController,
} from "./invitation.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { requireProjectRole } from "../../middleware/projectAuthorization.middleware";
import { ProjectMemberRole } from "../../generated/prisma/enums";

const router = Router();

// Project Routes
router.post("/", authenticate, createProjectController);
router.patch("/:id", authenticate, updateProjectController);
router.get("/:id", authenticate, getProjectByIdController);
router.get("/", authenticate, getProjectsController);
router.delete("/:id", authenticate, deleteProjectController);

// Project Members Route
router.get(
  "/:id/members",
  authenticate,
  requireProjectRole([ProjectMemberRole.OWNER, ProjectMemberRole.MEMBER]),
  getProjectMembersController
);
router.delete(
  "/:id/members/:userId",
  authenticate,
  requireProjectRole([ProjectMemberRole.OWNER]),
  removeProjectMemberController
);

// Invitation Routes
router.post(
  "/:id/invitations",
  authenticate,
  requireProjectRole([ProjectMemberRole.OWNER]),
  createInvitationController
);
router.patch("/invitations/:invitationId/accept", authenticate, acceptInvitationController);
router.patch("/invitations/:invitationId/reject", authenticate, rejectInvitationController);

export default router;
