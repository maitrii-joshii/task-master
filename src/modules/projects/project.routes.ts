import { Router } from "express";
import {
  createProjectController,
  updateProjectController,
  getProjectByIdController,
  getProjectsController,
  deleteProjectController,
} from "./project.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

router.post("/", authenticate, createProjectController);
router.patch("/:id", authenticate, updateProjectController);
router.get("/:id", authenticate, getProjectByIdController);
router.get("/", authenticate, getProjectsController);
router.delete("/:id", authenticate, deleteProjectController);

export default router;
