import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { getUser, updateUser } from "./user.controller";

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User profile management
 */

const router = Router();

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Authentication required
 *       404:
 *         description: User not found
 */
router.get("/profile", authenticate, getUser);

/**
 * @swagger
 * /users/profile:
 *   patch:
 *     summary: Update current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
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
 *                 example: John Doe
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Authentication required
 *       404:
 *         description: User not found
 */
router.patch("/profile", authenticate, updateUser);

export default router;
