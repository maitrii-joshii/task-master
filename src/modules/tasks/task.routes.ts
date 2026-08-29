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
 *   name: Tasks
 *   description: Task management
 */

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Comments on tasks
 */

/**
 * @swagger
 * tags:
 *   name: Attachments
 *   description: File attachments for tasks
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
 *     tags: [Tasks]
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
 *                 example: Implement JWT authentication and refresh token flow
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

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: Get tasks
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Authentication required
 */
router.get("/", authenticate, getTasksController);

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     summary: Get a task by ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task retrieved successfully
 *       400:
 *         description: Invalid task ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: User is not authorized to view the task
 *       404:
 *         description: Task not found
 */
router.get("/:id", authenticate, validateParams(idParamSchema), getTaskByIdController);

/**
 * @swagger
 * /tasks/{id}:
 *   patch:
 *     summary: Update a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task updated successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Authentication required
 *       403:
 *         description: User is not authorized to update the task
 *       404:
 *         description: Task not found
 */
router.patch("/:id", authenticate, validateParams(idParamSchema), updateTaskController);

/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     summary: Delete a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *     responses:
 *       204:
 *         description: Task deleted successfully
 *       400:
 *         description: Invalid task ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: User is not authorized to delete the task
 *       404:
 *         description: Task not found
 */
router.delete("/:id", authenticate, validateParams(idParamSchema), deleteTaskController);

/**
 * @swagger
 * /tasks/{id}/assign:
 *   patch:
 *     summary: Assign a task to a user
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task assigned successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Authentication required
 *       403:
 *         description: User is not authorized to assign the task
 *       404:
 *         description: Task or assignee not found
 */
router.patch("/:id/assign", authenticate, validateParams(idParamSchema), assignTaskController);

/**
 * @swagger
 * /tasks/{id}/status:
 *   patch:
 *     summary: Update task status
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task status updated successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Authentication required
 *       403:
 *         description: User is not authorized to update task status
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
 *     tags: [Comments]
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
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Authentication required
 *       403:
 *         description: User is not authorized to comment on this task
 *       404:
 *         description: Task not found
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
 *     tags: [Comments]
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
 *       400:
 *         description: Invalid task ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: User is not authorized to view comments
 *       404:
 *         description: Task not found
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
 *     tags: [Comments]
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
 *       400:
 *         description: Invalid task or comment ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: User is not authorized to view this comment
 *       404:
 *         description: Comment not found
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
 *     tags: [Comments]
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
 *                 example: Updated comment content.
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Authentication required
 *       403:
 *         description: User is not authorized to update this comment
 *       404:
 *         description: Comment not found
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
 *     tags: [Comments]
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
 *       204:
 *         description: Comment deleted successfully
 *       400:
 *         description: Invalid task or comment ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: User is not authorized to delete this comment
 *       404:
 *         description: Comment not found
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
 *     tags: [Attachments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
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
 *         description: User is not authorized to upload an attachment
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
 *     tags: [Attachments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Attachments retrieved successfully
 *       400:
 *         description: Invalid task ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: User is not authorized to view attachments
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
 *     tags: [Attachments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *       - in: path
 *         name: attachmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Attachment ID
 *     responses:
 *       200:
 *         description: Attachment retrieved successfully
 *       400:
 *         description: Invalid task or attachment ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: User is not authorized to view this attachment
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
 *     tags: [Attachments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *       - in: path
 *         name: attachmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Attachment ID
 *     responses:
 *       204:
 *         description: Attachment deleted successfully
 *       400:
 *         description: Invalid task or attachment ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: User is not authorized to delete this attachment
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
