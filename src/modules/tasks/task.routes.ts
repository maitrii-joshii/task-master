import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
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
router.get("/:id", authenticate, getTaskByIdController);
router.get("/", authenticate, getTasksController);
router.patch("/:id", authenticate, updateTaskController);
router.delete("/:id", authenticate, deleteTaskController);
router.patch("/:id/assign", authenticate, assignTaskController);
router.patch("/:id/status", authenticate, updateTaskStatusController);

export default router;
