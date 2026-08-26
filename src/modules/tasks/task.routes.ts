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

const router = Router();

router.post("/", authenticate, createTaskController);
router.get("/:id", authenticate, validateParams(idParamSchema), getTaskByIdController);
router.get("/", authenticate, getTasksController);
router.patch("/:id", authenticate, validateParams(idParamSchema), updateTaskController);
router.delete("/:id", authenticate, validateParams(idParamSchema), deleteTaskController);
router.patch("/:id/assign", authenticate, validateParams(idParamSchema), assignTaskController);
router.patch(
  "/:id/status",
  authenticate,
  validateParams(idParamSchema),
  updateTaskStatusController
);

export default router;
