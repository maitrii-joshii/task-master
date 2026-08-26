import prisma from "../../config/prisma";
import { AppError } from "../../utils/appError";
import { CreateTaskInput, UpdateTaskInput } from "./task.types";
import { TaskStatus } from "../../generated/prisma/enums";

export const createTask = async (userId: string, input: CreateTaskInput) => {
  const { title, description, dueDate, projectId, assigneeId } = input;

  // Project task
  if (projectId) {
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      throw new AppError("Project not found", 404);
    }

    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new AppError("You are not a member of this project", 403);
    }
  }

  // Validate assignee
  if (assigneeId) {
    if (projectId) {
      const assigneeMembership = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: assigneeId,
          },
        },
      });

      if (!assigneeMembership) {
        throw new AppError("Assignee is not a member of this project", 400);
      }
    } else {
      const assignee = await prisma.user.findUnique({
        where: {
          id: assigneeId,
        },
      });

      if (!assignee) {
        throw new AppError("Assignee not found", 404);
      }
    }
  }

  const task = await prisma.task.create({
    data: {
      title,
      description,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      projectId,
      creatorId: userId,
      assigneeId,
    },
  });

  return task;
};

export const getTaskById = async (taskId: string, userId: string) => {
  const task = await prisma.task.findUnique({
    where: {
      id: taskId,
    },
  });

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  // Personal task
  if (!task.projectId) {
    if (task.creatorId !== userId && task.assigneeId !== userId) {
      throw new AppError("You are not authorized to view this task", 403);
    }

    return task;
  }

  // Project task
  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId: task.projectId,
        userId,
      },
    },
  });

  if (!membership) {
    throw new AppError("You are not a member of this project", 403);
  }

  return task;
};

export const getTasks = async (
  userId: string,
  filters: {
    status?: TaskStatus;
    projectId?: string;
    assigneeId?: string;
    creatorId?: string;
    search?: string;
    sortBy?: "createdAt" | "updatedAt" | "dueDate" | "title" | "status";
    sortOrder?: "asc" | "desc";
    page?: number;
    limit?: number;
  } = {}
) => {
  const projectMemberships = await prisma.projectMember.findMany({
    where: {
      userId,
    },
    select: {
      projectId: true,
    },
  });

  const projectIds = projectMemberships.map((membership) => membership.projectId);

  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const skip = (page - 1) * limit;

  const orderBy = {
    [filters.sortBy || "createdAt"]: filters.sortOrder || "desc",
  };

  const where = {
    AND: [
      // Task visibility
      {
        OR: [
          {
            // Personal tasks
            projectId: null,
            OR: [
              {
                creatorId: userId,
              },
              {
                assigneeId: userId,
              },
            ],
          },
          {
            // Project tasks
            projectId: {
              in: projectIds,
            },
          },
        ],
      },

      // Status filter
      ...(filters.status
        ? [
            {
              status: filters.status,
            },
          ]
        : []),

      // Project filter
      ...(filters.projectId
        ? [
            {
              projectId: filters.projectId,
            },
          ]
        : []),

      // Assignee filter
      ...(filters.assigneeId
        ? [
            {
              assigneeId: filters.assigneeId,
            },
          ]
        : []),

      // Creator filter
      ...(filters.creatorId
        ? [
            {
              creatorId: filters.creatorId,
            },
          ]
        : []),

      // Search
      ...(filters.search
        ? [
            {
              OR: [
                {
                  title: {
                    contains: filters.search,
                    mode: "insensitive" as const,
                  },
                },
                {
                  description: {
                    contains: filters.search,
                    mode: "insensitive" as const,
                  },
                },
              ],
            },
          ]
        : []),
    ],
  };

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy,
      skip,
      take: limit,
    }),

    prisma.task.count({
      where,
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    tasks,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

export const updateTask = async (taskId: string, userId: string, input: UpdateTaskInput) => {
  const task = await prisma.task.findUnique({
    where: {
      id: taskId,
    },
  });

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  // Personal task authorization
  if (!task.projectId) {
    if (task.creatorId !== userId && task.assigneeId !== userId) {
      throw new AppError("You are not authorized to update this task", 403);
    }
  }

  // Project task authorization
  if (task.projectId) {
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: task.projectId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new AppError("You are not a member of this project", 403);
    }
  }

  // Validate assignee for project tasks
  if (input.assigneeId && task.projectId) {
    const assigneeMembership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: task.projectId,
          userId: input.assigneeId,
        },
      },
    });

    if (!assigneeMembership) {
      throw new AppError("Assignee is not a member of this project", 400);
    }
  }

  // Validate assignee for personal tasks
  if (input.assigneeId && !task.projectId) {
    const assignee = await prisma.user.findUnique({
      where: {
        id: input.assigneeId,
      },
    });

    if (!assignee) {
      throw new AppError("Assignee not found", 404);
    }
  }

  const updatedTask = await prisma.task.update({
    where: {
      id: taskId,
    },
    data: {
      title: input.title,
      description: input.description,

      dueDate:
        input.dueDate !== undefined ? (input.dueDate ? new Date(input.dueDate) : null) : undefined,

      assigneeId: input.assigneeId !== undefined ? input.assigneeId : undefined,
    },
  });

  return updatedTask;
};

export const deleteTask = async (taskId: string, userId: string) => {
  const task = await prisma.task.findUnique({
    where: {
      id: taskId,
    },
  });

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  // Personal task authorization
  if (!task.projectId) {
    if (task.creatorId !== userId) {
      throw new AppError("Only the task creator can delete this task", 403);
    }
  }

  // Project task authorization
  if (task.projectId) {
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: task.projectId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new AppError("You are not a member of this project", 403);
    }

    // For now, project members can delete tasks.
    // We will refine this with Owner/Member RBAC later.
  }

  await prisma.task.delete({
    where: {
      id: taskId,
    },
  });
};

export const assignTask = async (taskId: string, userId: string, assigneeId: string) => {
  const task = await prisma.task.findUnique({
    where: {
      id: taskId,
    },
  });

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  // Personal task
  if (!task.projectId) {
    if (task.creatorId !== userId) {
      throw new AppError("Only the task creator can assign this task", 403);
    }

    const assignee = await prisma.user.findUnique({
      where: {
        id: assigneeId,
      },
    });

    if (!assignee) {
      throw new AppError("Assignee not found", 404);
    }
  }

  // Project task
  if (task.projectId) {
    const requesterMembership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: task.projectId,
          userId,
        },
      },
    });

    if (!requesterMembership) {
      throw new AppError("You are not a member of this project", 403);
    }

    const assigneeMembership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: task.projectId,
          userId: assigneeId,
        },
      },
    });

    if (!assigneeMembership) {
      throw new AppError("Assignee is not a member of this project", 400);
    }
  }

  const updatedTask = await prisma.task.update({
    where: {
      id: taskId,
    },
    data: {
      assigneeId,
    },
  });

  return updatedTask;
};

export const updateTaskStatus = async (taskId: string, userId: string, status: TaskStatus) => {
  const task = await prisma.task.findUnique({
    where: {
      id: taskId,
    },
  });

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  // Prevent updating to the same status
  if (task.status === status) {
    throw new AppError(`Task is already ${status}`, 400);
  }

  // Personal task authorization
  if (!task.projectId) {
    if (task.creatorId !== userId && task.assigneeId !== userId) {
      throw new AppError("You are not authorized to update this task", 403);
    }
  }

  // Project task authorization
  if (task.projectId) {
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: task.projectId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new AppError("You are not a member of this project", 403);
    }
  }

  const updatedTask = await prisma.task.update({
    where: {
      id: taskId,
    },
    data: {
      status,
    },
  });

  return updatedTask;
};
