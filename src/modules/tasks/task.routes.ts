import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { validateParams } from "../../middleware/validate.middleware";

import {
  idParamSchema,
  taskIdParamSchema,
  commentIdParamSchema,
  attachmentIdParamSchema,
} from "../../schemas/common.schema";

import {
  createTaskController,
  generateTaskDescriptionController,
  getTaskByIdController,
  getTasksController,
  updateTaskController,
  deleteTaskController,
  assignTaskController,
  updateTaskStatusController,
} from "./task.controller";

import {
  createCommentController,
  getTaskCommentsController,
  getCommentByIdController,
  updateCommentController,
  deleteCommentController,
} from "./comments/comment.controller";

import {
  uploadAttachmentController,
  getTaskAttachmentsController,
  getAttachmentByIdController,
  deleteAttachmentController,
} from "./attachments/attachment.controller";

import { upload } from "./attachments/attachment.upload";

/**
 * @swagger
 * tags:
 *   - name: Tasks
 *     description: Task management
 *   - name: AI
 *     description: AI-powered task features
 *   - name: Comments
 *     description: Comments on tasks
 *   - name: Attachments
 *     description: File attachments for tasks
 */

const router = Router();

/* ============================================================
   TASKS
   ============================================================ */

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Create a new task
 *     tags:
 *       - Tasks
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 90
 *                 example: Implement authentication
 *               description:
 *                 type: string
 *                 maxLength: 4500
 *                 example: Implement JWT authentication
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-09-01T18:00:00.000Z
 *               projectId:
 *                 type: string
 *                 format: uuid
 *                 example: 550e8400-e29b-41d4-a716-446655440000
 *               assigneeId:
 *                 type: string
 *                 format: uuid
 *                 example: 6ba7b810-9dad-11d1-80b4-00c04fd430c8
 *     responses:
 *       201:
 *         description: Task created successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Authentication required
 */
router.post("/", authenticate, createTaskController);

/* ============================================================
   AI
   ============================================================ */

/**
 * @swagger
 * /tasks/ai/generate-description:
 *   post:
 *     summary: Generate a task description using AI
 *     description: Generates a task description from a task title using the configured AI model.
 *     tags:
 *       - AI
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 example: Implement JWT authentication
 *     responses:
 *       200:
 *         description: Task description generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                       example: Implement JWT authentication
 *                     description:
 *                       type: string
 *                       example: Implement secure JWT-based authentication for user login and protected API endpoints.
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Authentication required
 *       500:
 *         description: AI service error
 */
router.post("/ai/generate-description", authenticate, generateTaskDescriptionController);

/* ============================================================
   GET TASKS
   ============================================================ */

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: Get tasks
 *     tags:
 *       - Tasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum: [TODO, IN_PROGRESS, COMPLETED]
 *         description: Filter tasks by status
 *       - in: query
 *         name: projectId
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: assigneeId
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: creatorId
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *         description: Search by title or description
 *       - in: query
 *         name: sortBy
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - createdAt
 *             - updatedAt
 *             - dueDate
 *             - title
 *             - status
 *       - in: query
 *         name: sortOrder
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - asc
 *             - desc
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Authentication required
 */
router.get("/", authenticate, getTasksController);

/* ============================================================
   TASK BY ID
   ============================================================ */

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     summary: Get a task by ID
 *     tags:
 *       - Tasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Task retrieved successfully
 *       400:
 *         description: Invalid task ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: User is not authorized
 *       404:
 *         description: Task not found
 */
router.get("/:id", authenticate, validateParams(idParamSchema), getTaskByIdController);

/* ============================================================
   UPDATE TASK
   ============================================================ */

/**
 * @swagger
 * /tasks/{id}:
 *   patch:
 *     summary: Update a task
 *     tags:
 *       - Tasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 90
 *               description:
 *                 type: string
 *                 maxLength: 4500
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               assigneeId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Task updated successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Authentication required
 *       403:
 *         description: User is not authorized
 *       404:
 *         description: Task not found
 */
router.patch("/:id", authenticate, validateParams(idParamSchema), updateTaskController);

/* ============================================================
   DELETE TASK
   ============================================================ */

/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     summary: Delete a task
 *     tags:
 *       - Tasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Task deleted successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: User is not authorized
 *       404:
 *         description: Task not found
 */
router.delete("/:id", authenticate, validateParams(idParamSchema), deleteTaskController);

/* ============================================================
   ASSIGN TASK
   ============================================================ */

/**
 * @swagger
 * /tasks/{id}/assign:
 *   patch:
 *     summary: Assign a task to a user
 *     tags:
 *       - Tasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assigneeId
 *             properties:
 *               assigneeId:
 *                 type: string
 *                 format: uuid
 *                 example: 6ba7b810-9dad-11d1-80b4-00c04fd430c8
 *     responses:
 *       200:
 *         description: Task assigned successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Authentication required
 *       403:
 *         description: User is not authorized
 *       404:
 *         description: Task or assignee not found
 */
router.patch("/:id/assign", authenticate, validateParams(idParamSchema), assignTaskController);

/* ============================================================
   UPDATE TASK STATUS
   ============================================================ */

/**
 * @swagger
 * /tasks/{id}/status:
 *   patch:
 *     summary: Update task status
 *     tags:
 *       - Tasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum:
 *                   - TODO
 *                   - IN_PROGRESS
 *                   - COMPLETED
 *                 example: COMPLETED
 *     responses:
 *       200:
 *         description: Task status updated successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Authentication required
 *       403:
 *         description: User is not authorized
 *       404:
 *         description: Task not found
 */
router.patch(
  "/:id/status",
  authenticate,
  validateParams(idParamSchema),
  updateTaskStatusController
);

/* ============================================================
   COMMENTS
   ============================================================ */

/**
 * @swagger
 * /tasks/{taskId}/comments:
 *   post:
 *     summary: Create a comment on a task
 *     tags:
 *       - Comments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1500
 *                 example: This task needs to be completed before Friday.
 *     responses:
 *       201:
 *         description: Comment created successfully
 */
router.post(
  "/:taskId/comments",
  authenticate,
  validateParams(taskIdParamSchema),
  createCommentController
);

/**
 * @swagger
 * /tasks/{taskId}/comments:
 *   get:
 *     summary: Get all comments for a task
 *     tags:
 *       - Comments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
 */
router.get(
  "/:taskId/comments",
  authenticate,
  validateParams(taskIdParamSchema),
  getTaskCommentsController
);

/**
 * @swagger
 * /tasks/{taskId}/comments/{commentId}:
 *   get:
 *     summary: Get a single comment
 *     tags:
 *       - Comments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Comment retrieved successfully
 */
router.get(
  "/:taskId/comments/:commentId",
  authenticate,
  validateParams(taskIdParamSchema.merge(commentIdParamSchema)),
  getCommentByIdController
);

/**
 * @swagger
 * /tasks/{taskId}/comments/{commentId}:
 *   patch:
 *     summary: Update a comment
 *     tags:
 *       - Comments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1500
 *     responses:
 *       200:
 *         description: Comment updated successfully
 */
router.patch(
  "/:taskId/comments/:commentId",
  authenticate,
  validateParams(taskIdParamSchema.merge(commentIdParamSchema)),
  updateCommentController
);

/**
 * @swagger
 * /tasks/{taskId}/comments/{commentId}:
 *   delete:
 *     summary: Delete a comment
 *     tags:
 *       - Comments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Comment deleted successfully
 */
router.delete(
  "/:taskId/comments/:commentId",
  authenticate,
  validateParams(taskIdParamSchema.merge(commentIdParamSchema)),
  deleteCommentController
);

/* ============================================================
   ATTACHMENTS
   ============================================================ */

/**
 * @swagger
 * /tasks/{taskId}/attachments:
 *   post:
 *     summary: Upload an attachment to a task
 *     description: Upload a file and attach it to an existing task.
 *     tags:
 *       - Attachments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         description: Task ID
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to upload
 *     responses:
 *       201:
 *         description: Attachment uploaded successfully
 *       400:
 *         description: Invalid file or task ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: User is not authorized to upload attachment
 *       404:
 *         description: Task not found
 */
router.post(
  "/:taskId/attachments",
  authenticate,
  validateParams(taskIdParamSchema),
  upload.single("file"),
  uploadAttachmentController
);

/**
 * @swagger
 * /tasks/{taskId}/attachments:
 *   get:
 *     summary: Get all attachments for a task
 *     tags:
 *       - Attachments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         description: Task ID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Attachments retrieved successfully
 *       400:
 *         description: Invalid task ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: User is not authorized
 *       404:
 *         description: Task not found
 */
router.get(
  "/:taskId/attachments",
  authenticate,
  validateParams(taskIdParamSchema),
  getTaskAttachmentsController
);

/**
 * @swagger
 * /tasks/{taskId}/attachments/{attachmentId}:
 *   get:
 *     summary: Get an attachment by ID
 *     tags:
 *       - Attachments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         description: Task ID
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: attachmentId
 *         required: true
 *         description: Attachment ID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Attachment retrieved successfully
 *       400:
 *         description: Invalid task or attachment ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: User is not authorized
 *       404:
 *         description: Attachment not found
 */
router.get(
  "/:taskId/attachments/:attachmentId",
  authenticate,
  validateParams(taskIdParamSchema.merge(attachmentIdParamSchema)),
  getAttachmentByIdController
);

/**
 * @swagger
 * /tasks/{taskId}/attachments/{attachmentId}:
 *   delete:
 *     summary: Delete an attachment
 *     tags:
 *       - Attachments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         description: Task ID
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: attachmentId
 *         required: true
 *         description: Attachment ID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Attachment deleted successfully
 *       400:
 *         description: Invalid task or attachment ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: User is not authorized to delete attachment
 *       404:
 *         description: Attachment not found
 */
router.delete(
  "/:taskId/attachments/:attachmentId",
  authenticate,
  validateParams(taskIdParamSchema.merge(attachmentIdParamSchema)),
  deleteAttachmentController
);

export default router;
