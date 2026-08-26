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
import { validateParams } from "../../middleware/validate.middleware";

import {
  idParamSchema,
  projectMemberParamsSchema,
  invitationIdParamSchema,
} from "../../schemas/common.schema";

import { ProjectMemberRole } from "../../generated/prisma/enums";

const router = Router();

// Project Routes

router.post("/", authenticate, createProjectController);

router.patch("/:id", authenticate, validateParams(idParamSchema), updateProjectController);

router.get("/:id", authenticate, validateParams(idParamSchema), getProjectByIdController);

router.get("/", authenticate, getProjectsController);

router.delete("/:id", authenticate, validateParams(idParamSchema), deleteProjectController);

// Project Members Routes

router.get(
  "/:id/members",
  authenticate,
  validateParams(idParamSchema),
  requireProjectRole([ProjectMemberRole.OWNER, ProjectMemberRole.MEMBER]),
  getProjectMembersController
);

router.delete(
  "/:id/members/:userId",
  authenticate,
  validateParams(projectMemberParamsSchema),
  requireProjectRole([ProjectMemberRole.OWNER]),
  removeProjectMemberController
);

// Invitation Routes

router.post(
  "/:id/invitations",
  authenticate,
  validateParams(idParamSchema),
  requireProjectRole([ProjectMemberRole.OWNER]),
  createInvitationController
);

router.patch(
  "/invitations/:invitationId/accept",
  authenticate,
  validateParams(invitationIdParamSchema),
  acceptInvitationController
);

router.patch(
  "/invitations/:invitationId/reject",
  authenticate,
  validateParams(invitationIdParamSchema),
  rejectInvitationController
);

export default router;
