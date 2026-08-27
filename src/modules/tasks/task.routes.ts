import { Router } from "express";

import { authenticate } from "../../middleware/auth.middleware";
import { validateParams } from "../../middleware/validate.middleware";
import { idParamSchema } from "../../schemas/common.schema";

import {
  createTaskController,
  getTaskByIdController,
  getTasksController,
  updateTaskController,
  deleteTaskController,
  assignTaskController,
  updateTaskStatusController,
} from "./task.controller";

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Task management and collaboration
 */

const router = Router();

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
 * /tasks:
 *   get:
 *     summary: Get tasks
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [OPEN, IN_PROGRESS, COMPLETED, CANCELLED]
 *         description: Filter tasks by status
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter tasks by project
 *       - in: query
 *         name: assigneeId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter tasks by assignee
 *       - in: query
 *         name: creatorId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter tasks by creator
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search tasks
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, dueDate, title, status]
 *         description: Field used to sort tasks
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort direction
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of tasks per page
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 90
 *                 example: Updated authentication task
 *               description:
 *                 type: string
 *                 maxLength: 4500
 *                 example: Updated task description
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-09-05T18:00:00.000Z
 *               assigneeId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 example: 6ba7b810-9dad-11d1-80b4-00c04fd430c8
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
 *                 enum: [OPEN, IN_PROGRESS, COMPLETED, CANCELLED]
 *                 example: COMPLETED
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

export default router;
