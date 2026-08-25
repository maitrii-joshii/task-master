import prisma from "../../config/prisma";
import { createProjectSchema, updateProjectSchema } from "./project.schema";
import { AppError } from "../../utils/appError";

export const createProject = async (userId: string, input: unknown) => {
  const data = createProjectSchema.parse(input);

  const project = await prisma.project.create({
    data: {
      name: data.name,
      description: data.description,
      ownerId: userId,
    },
  });

  return project;
};

export const updateProject = async (projectId: string, userId: string, input: unknown) => {
  const data = updateProjectSchema.parse(input);

  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
  });

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  if (project.ownerId !== userId) {
    throw new AppError("You are not authorized to update this project", 403);
  }

  const updatedProject = await prisma.project.update({
    where: {
      id: projectId,
    },
    data,
  });

  return updatedProject;
};

export const getProjectById = async (projectId: string, userId: string) => {
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    include: {
      members: true,
    },
  });

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  const isMember = project.members.some((member) => member.userId === userId);

  if (!isMember && project.ownerId !== userId) {
    throw new AppError("You are not authorized to view this project", 403);
  }

  return project;
};

export const getProjects = async (userId: string) => {
  const projects = await prisma.project.findMany({
    where: {
      OR: [
        {
          ownerId: userId,
        },
        {
          members: {
            some: {
              userId,
            },
          },
        },
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return projects;
};

export const deleteProject = async (projectId: string, userId: string) => {
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
  });

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  if (project.ownerId !== userId) {
    throw new AppError("You are not authorized to delete this project", 403);
  }

  await prisma.project.delete({
    where: {
      id: projectId,
    },
  });
};
