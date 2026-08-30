import prisma from "../../config/prisma";
import { AppError } from "../../utils/appError";
import { CreateTaskInput, UpdateTaskInput } from "./task.types";
import { TaskStatus } from "../../generated/prisma/enums";
import { getCache, setCache, invalidateCacheByPrefix } from "../../services/redis";
import { websocketManager } from "../../webSocket/webSocket.manager";

const TASK_CACHE_PREFIX = "tasks";

type TaskFilters = {
  status?: TaskStatus;
  projectId?: string;
  assigneeId?: string;
  creatorId?: string;
  search?: string;
  sortBy?: "createdAt" | "updatedAt" | "dueDate" | "title" | "status";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
};

/**
 * Generates a unique Redis cache key for a user's
 * task list and filter combination.
 */
const getTasksCacheKey = (userId: string, filters: TaskFilters): string => {
  return `${TASK_CACHE_PREFIX}:${userId}:${JSON.stringify(filters)}`;
};

/**
 * Invalidates all cached task lists.
 */
const invalidateTaskCaches = async (): Promise<void> => {
  await invalidateCacheByPrefix(`${TASK_CACHE_PREFIX}:`);
};

/**
 * Send a real-time notification to a user.
 *
 * If the user is not connected, websocketManager
 * simply ignores the notification.
 *
 * WebSocket notification failure should never
 * break the main REST API operation.
 */
const notifyUser = (userId: string, type: string, message: string, data?: unknown): void => {
  try {
    websocketManager.sendToUser(userId, {
      type,
      message,
      data,
    });
  } catch (error) {
    console.error(`Failed to send WebSocket notification to user ${userId}:`, error);
  }
};

/**
 * Create a task
 */
export const createTask = async (userId: string, input: CreateTaskInput) => {
  const { title, description, dueDate, projectId, assigneeId } = input;

  // -----------------------------------------
  // Validate project
  // -----------------------------------------

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

  // -----------------------------------------
  // Validate assignee
  // -----------------------------------------

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

  // -----------------------------------------
  // Create task
  // -----------------------------------------

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

  // -----------------------------------------
  // Invalidate task list cache
  // -----------------------------------------

  await invalidateTaskCaches();

  // -----------------------------------------
  // Notify assignee
  // -----------------------------------------

  if (assigneeId && assigneeId !== userId) {
    notifyUser(assigneeId, "TASK_CREATED", "A new task has been created for you", task);
  }

  return task;
};

/**
 * Get a single task
 */
export const getTaskById = async (taskId: string, userId: string) => {
  const task = await prisma.task.findUnique({
    where: {
      id: taskId,
    },
  });

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  // -----------------------------------------
  // Personal task
  // -----------------------------------------

  if (!task.projectId) {
    if (task.creatorId !== userId && task.assigneeId !== userId) {
      throw new AppError("You are not authorized to view this task", 403);
    }

    return task;
  }

  // -----------------------------------------
  // Project task
  // -----------------------------------------

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

/**
 * Get tasks
 */
export const getTasks = async (userId: string, filters: TaskFilters = {}) => {
  const cacheKey = getTasksCacheKey(userId, filters);

  // -----------------------------------------
  // 1. Try Redis cache
  // -----------------------------------------

  try {
    const cachedTasks = await getCache(cacheKey);

    if (cachedTasks) {
      console.log("Redis cache HIT:", cacheKey);

      return JSON.parse(cachedTasks);
    }

    console.log("Redis cache MISS:", cacheKey);
  } catch (error) {
    console.error("Redis GET failed, falling back to database:", error);
  }

  // -----------------------------------------
  // 2. Get user's project memberships
  // -----------------------------------------

  const projectMemberships = await prisma.projectMember.findMany({
    where: {
      userId,
    },
    select: {
      projectId: true,
    },
  });

  const projectIds = projectMemberships.map((membership) => membership.projectId);

  // -----------------------------------------
  // 3. Pagination
  // -----------------------------------------

  const page = filters.page || 1;
  const limit = filters.limit || 10;

  const skip = (page - 1) * limit;

  // -----------------------------------------
  // 4. Sorting
  // -----------------------------------------

  const orderBy = {
    [filters.sortBy || "createdAt"]: filters.sortOrder || "desc",
  };

  // -----------------------------------------
  // 5. Build query
  // -----------------------------------------

  const where = {
    AND: [
      // Task visibility
      {
        OR: [
          // Personal tasks
          {
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

          // Project tasks
          {
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

  // -----------------------------------------
  // 6. Query database
  // -----------------------------------------

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

  // -----------------------------------------
  // 7. Pagination result
  // -----------------------------------------

  const totalPages = Math.ceil(total / limit);

  const result = {
    tasks,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };

  // -----------------------------------------
  // 8. Store in Redis
  // -----------------------------------------

  try {
    await setCache(cacheKey, JSON.stringify(result));

    console.log("Tasks cached:", cacheKey);
  } catch (error) {
    console.error("Redis SET failed, continuing without cache:", error);
  }

  return result;
};

/**
 * Update task
 */
export const updateTask = async (taskId: string, userId: string, input: UpdateTaskInput) => {
  const task = await prisma.task.findUnique({
    where: {
      id: taskId,
    },
  });

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  // -----------------------------------------
  // Personal task authorization
  // -----------------------------------------

  if (!task.projectId) {
    if (task.creatorId !== userId && task.assigneeId !== userId) {
      throw new AppError("You are not authorized to update this task", 403);
    }
  }

  // -----------------------------------------
  // Project task authorization
  // -----------------------------------------

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

  // -----------------------------------------
  // Validate assignee for project task
  // -----------------------------------------

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

  // -----------------------------------------
  // Validate assignee for personal task
  // -----------------------------------------

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

  // -----------------------------------------
  // Update task
  // -----------------------------------------

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

  // -----------------------------------------
  // Invalidate cache
  // -----------------------------------------

  await invalidateTaskCaches();

  // -----------------------------------------
  // Notify creator
  // -----------------------------------------

  if (updatedTask.creatorId !== userId && updatedTask.creatorId !== updatedTask.assigneeId) {
    notifyUser(
      updatedTask.creatorId,
      "TASK_UPDATED",
      "A task you created has been updated",
      updatedTask
    );
  }

  // -----------------------------------------
  // Notify assignee
  // -----------------------------------------

  if (updatedTask.assigneeId && updatedTask.assigneeId !== userId) {
    notifyUser(
      updatedTask.assigneeId,
      "TASK_UPDATED",
      "A task assigned to you has been updated",
      updatedTask
    );
  }

  return updatedTask;
};

/**
 * Delete task
 */
export const deleteTask = async (taskId: string, userId: string) => {
  const task = await prisma.task.findUnique({
    where: {
      id: taskId,
    },
  });

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  // -----------------------------------------
  // Personal task authorization
  // -----------------------------------------

  if (!task.projectId) {
    if (task.creatorId !== userId) {
      throw new AppError("Only the task creator can delete this task", 403);
    }
  }

  // -----------------------------------------
  // Project task authorization
  // -----------------------------------------

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

  // -----------------------------------------
  // Save notification recipients
  // -----------------------------------------

  const creatorId = task.creatorId;
  const assigneeId = task.assigneeId;

  // -----------------------------------------
  // Delete task
  // -----------------------------------------

  await prisma.task.delete({
    where: {
      id: taskId,
    },
  });

  // -----------------------------------------
  // Invalidate cache
  // -----------------------------------------

  await invalidateTaskCaches();

  // -----------------------------------------
  // Notify creator
  // -----------------------------------------

  if (creatorId !== userId) {
    notifyUser(creatorId, "TASK_DELETED", "A task you created has been deleted", {
      taskId: task.id,
      title: task.title,
    });
  }

  // -----------------------------------------
  // Notify assignee
  // -----------------------------------------

  if (assigneeId && assigneeId !== userId && assigneeId !== creatorId) {
    notifyUser(assigneeId, "TASK_DELETED", "A task assigned to you has been deleted", {
      taskId: task.id,
      title: task.title,
    });
  }
};

/**
 * Assign task
 */
export const assignTask = async (taskId: string, userId: string, assigneeId: string) => {
  const task = await prisma.task.findUnique({
    where: {
      id: taskId,
    },
  });

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  // -----------------------------------------
  // Personal task
  // -----------------------------------------

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

  // -----------------------------------------
  // Project task
  // -----------------------------------------

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

  // -----------------------------------------
  // Assign task
  // -----------------------------------------

  const updatedTask = await prisma.task.update({
    where: {
      id: taskId,
    },
    data: {
      assigneeId,
    },
  });

  // -----------------------------------------
  // Invalidate cache
  // -----------------------------------------

  await invalidateTaskCaches();

  // -----------------------------------------
  // Notify new assignee
  // -----------------------------------------

  if (assigneeId !== userId) {
    notifyUser(assigneeId, "TASK_ASSIGNED", "A task has been assigned to you", updatedTask);
  }

  // -----------------------------------------
  // Notify previous assignee
  // -----------------------------------------

  if (task.assigneeId && task.assigneeId !== assigneeId && task.assigneeId !== userId) {
    notifyUser(
      task.assigneeId,
      "TASK_UPDATED",
      "A task previously assigned to you has been reassigned",
      updatedTask
    );
  }

  return updatedTask;
};

/**
 * Update task status
 */
export const updateTaskStatus = async (taskId: string, userId: string, status: TaskStatus) => {
  const task = await prisma.task.findUnique({
    where: {
      id: taskId,
    },
  });

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  // -----------------------------------------
  // Prevent same status update
  // -----------------------------------------

  if (task.status === status) {
    throw new AppError(`Task is already ${status}`, 400);
  }

  // -----------------------------------------
  // Personal task authorization
  // -----------------------------------------

  if (!task.projectId) {
    if (task.creatorId !== userId && task.assigneeId !== userId) {
      throw new AppError("You are not authorized to update this task", 403);
    }
  }

  // -----------------------------------------
  // Project task authorization
  // -----------------------------------------

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

  // -----------------------------------------
  // Update status
  // -----------------------------------------

  const updatedTask = await prisma.task.update({
    where: {
      id: taskId,
    },
    data: {
      status,
    },
  });

  // -----------------------------------------
  // Invalidate cache
  // -----------------------------------------

  await invalidateTaskCaches();

  // -----------------------------------------
  // Notify creator
  // -----------------------------------------

  if (task.creatorId !== userId && task.creatorId !== task.assigneeId) {
    notifyUser(
      task.creatorId,
      "TASK_STATUS_UPDATED",
      "The status of a task you created has been updated",
      updatedTask
    );
  }

  // -----------------------------------------
  // Notify assignee
  // -----------------------------------------

  if (task.assigneeId && task.assigneeId !== userId) {
    notifyUser(
      task.assigneeId,
      "TASK_STATUS_UPDATED",
      "The status of a task assigned to you has been updated",
      updatedTask
    );
  }

  return updatedTask;
};
