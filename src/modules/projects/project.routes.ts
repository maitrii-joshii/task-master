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

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Project and team management
 */

const router = Router();

/**
 * @swagger
 * /projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 90
 *                 example: TaskMaster Project
 *               description:
 *                 type: string
 *                 maxLength: 450
 *                 example: Collaborative task management project
 *     responses:
 *       201:
 *         description: Project created successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Authentication required
 */
router.post("/", authenticate, createProjectController);

/**
 * @swagger
 * /projects/{id}:
 *   patch:
 *     summary: Update a project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 90
 *                 example: Updated TaskMaster Project
 *               description:
 *                 type: string
 *                 maxLength: 450
 *                 nullable: true
 *                 example: Updated project description
 *     responses:
 *       200:
 *         description: Project updated successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Authentication required
 *       403:
 *         description: User is not authorized to update the project
 *       404:
 *         description: Project not found
 */
router.patch("/:id", authenticate, validateParams(idParamSchema), updateProjectController);

/**
 * @swagger
 * /projects/{id}:
 *   get:
 *     summary: Get a project by ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: User is not authorized to view the project
 *       404:
 *         description: Project not found
 */
router.get("/:id", authenticate, validateParams(idParamSchema), getProjectByIdController);

/**
 * @swagger
 * /projects:
 *   get:
 *     summary: Get all projects for the current user
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Projects retrieved successfully
 *       401:
 *         description: Authentication required
 */
router.get("/", authenticate, getProjectsController);

/**
 * @swagger
 * /projects/{id}:
 *   delete:
 *     summary: Delete a project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Project ID
 *     responses:
 *       204:
 *         description: Project deleted successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Authentication required
 *       403:
 *         description: User is not authorized to delete the project
 *       404:
 *         description: Project not found
 */
router.delete("/:id", authenticate, validateParams(idParamSchema), deleteProjectController);

/**
 * @swagger
 * /projects/{id}/members:
 *   get:
 *     summary: Get project members
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project members retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: User is not a member of the project
 *       404:
 *         description: Project not found
 */
router.get(
  "/:id/members",
  authenticate,
  validateParams(idParamSchema),
  requireProjectRole([ProjectMemberRole.OWNER, ProjectMemberRole.MEMBER]),
  getProjectMembersController
);

/**
 * @swagger
 * /projects/{id}/members/{userId}:
 *   delete:
 *     summary: Remove a member from a project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Project ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID of the member to remove
 *     responses:
 *       204:
 *         description: Project member removed successfully
 *       400:
 *         description: Project owner cannot be removed
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Only the project owner can remove members
 *       404:
 *         description: Project member not found
 */
router.delete(
  "/:id/members/:userId",
  authenticate,
  validateParams(projectMemberParamsSchema),
  requireProjectRole([ProjectMemberRole.OWNER]),
  removeProjectMemberController
);

/**
 * @swagger
 * /projects/{id}/invitations:
 *   post:
 *     summary: Invite a user to a project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - invitedUserId
 *             properties:
 *               invitedUserId:
 *                 type: string
 *                 format: uuid
 *                 example: 550e8400-e29b-41d4-a716-446655440000
 *     responses:
 *       201:
 *         description: Invitation created successfully
 *       400:
 *         description: Invalid request or self-invitation
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Only the project owner can invite users
 *       404:
 *         description: Project or invited user not found
 *       409:
 *         description: User is already a member or invitation already exists
 */
router.post(
  "/:id/invitations",
  authenticate,
  validateParams(idParamSchema),
  requireProjectRole([ProjectMemberRole.OWNER]),
  createInvitationController
);

/**
 * @swagger
 * /projects/invitations/{invitationId}/accept:
 *   patch:
 *     summary: Accept a project invitation
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invitationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Invitation ID
 *     responses:
 *       200:
 *         description: Invitation accepted and user added to project
 *       401:
 *         description: Authentication required
 *       403:
 *         description: User is not the invited user
 *       404:
 *         description: Invitation not found
 *       409:
 *         description: Invitation is no longer pending
 */
router.patch(
  "/invitations/:invitationId/accept",
  authenticate,
  validateParams(invitationIdParamSchema),
  acceptInvitationController
);

/**
 * @swagger
 * /projects/invitations/{invitationId}/reject:
 *   patch:
 *     summary: Reject a project invitation
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invitationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Invitation ID
 *     responses:
 *       200:
 *         description: Invitation rejected successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: User is not the invited user
 *       404:
 *         description: Invitation not found
 *       409:
 *         description: Invitation is no longer pending
 */
router.patch(
  "/invitations/:invitationId/reject",
  authenticate,
  validateParams(invitationIdParamSchema),
  rejectInvitationController
);

export default router;
