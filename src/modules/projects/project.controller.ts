import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.middleware";
import {
  createProject,
  updateProject,
  getProjectById,
  getProjects,
  deleteProject,
} from "./project.service";

export const createProjectController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const project = await createProject(req.userId!, req.body);

    res.status(201).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProjectController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;
    const projectId = req.params.id as string;

    const project = await updateProject(projectId, userId, req.body);

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectByIdController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;
    const projectId = req.params.id as string;

    const project = await getProjectById(projectId, userId);

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectsController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;

    const projects = await getProjects(userId);

    res.status(200).json({
      success: true,
      data: projects,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProjectController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;
    const projectId = req.params.id as string;

    await deleteProject(projectId, userId);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
