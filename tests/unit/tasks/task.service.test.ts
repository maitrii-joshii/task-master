import { AppError } from "../../../src/utils/appError";
import prisma from "../../../src/config/prisma";
import { TaskStatus } from "../../../src/generated/prisma/enums";

// ============================================================
// MOCK REDIS
// ============================================================
//
// Redis is NOT tested in this unit test.
// We mock Redis so task service tests never connect to
// a real Redis instance.
//
// Redis behavior should have its own dedicated tests if needed.
// ============================================================

jest.mock("../../../src/services/redis", () => ({
  __esModule: true,

  getCache: jest.fn().mockResolvedValue(null),

  setCache: jest.fn().mockResolvedValue(undefined),

  invalidateCacheByPrefix: jest.fn().mockResolvedValue(undefined),
}));

// ============================================================
// MOCK WEBSOCKET MANAGER
// ============================================================

jest.mock("../../../src/webSocket/webSocket.manager", () => ({
  __esModule: true,

  websocketManager: {
    sendToUser: jest.fn(),
  },
}));

// ============================================================
// MOCK PRISMA
// ============================================================

jest.mock("../../../src/config/prisma", () => ({
  __esModule: true,

  default: {
    project: {
      findUnique: jest.fn(),
    },

    projectMember: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },

    user: {
      findUnique: jest.fn(),
    },

    task: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// ============================================================
// IMPORT SERVICE AFTER MOCKS
// ============================================================

import {
  createTask,
  getTaskById,
  getTasks,
  updateTask,
  deleteTask,
  assignTask,
  updateTaskStatus,
} from "../../../src/modules/tasks/task.service";

import { websocketManager } from "../../../src/webSocket/webSocket.manager";

// ============================================================
// MOCK TYPES
// ============================================================

const mockPrisma = prisma as unknown as {
  project: {
    findUnique: jest.Mock;
  };

  projectMember: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
  };

  user: {
    findUnique: jest.Mock;
  };

  task: {
    create: jest.Mock;
    findUnique: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};

const mockSendToUser = websocketManager.sendToUser as jest.Mock;

// ============================================================
// TEST SUITE
// ============================================================

describe("Task Service", () => {
  const userId = "550e8400-e29b-41d4-a716-446655440001";
  const anotherUserId = "550e8400-e29b-41d4-a716-446655440002";
  const assigneeId = "550e8400-e29b-41d4-a716-446655440003";
  const projectId = "550e8400-e29b-41d4-a716-446655440004";
  const taskId = "550e8400-e29b-41d4-a716-446655440005";

  const personalTask = {
    id: taskId,
    title: "Personal Task",
    description: "Personal task description",
    dueDate: null,
    status: TaskStatus.OPEN,
    projectId: null,
    creatorId: userId,
    assigneeId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const projectTask = {
    ...personalTask,
    projectId,
    creatorId: userId,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Redis is intentionally mocked and disabled for unit tests.
    // These defaults prevent any real Redis connection.
    jest.requireMock("../../../src/services/redis").getCache.mockResolvedValue(null);

    jest.requireMock("../../../src/services/redis").setCache.mockResolvedValue(undefined);

    jest
      .requireMock("../../../src/services/redis")
      .invalidateCacheByPrefix.mockResolvedValue(undefined);

    // WebSocket default behavior
    mockSendToUser.mockImplementation(() => undefined);
  });

  // ============================================================
  // CREATE TASK
  // ============================================================

  describe("createTask", () => {
    it("should create a personal task successfully", async () => {
      const input = {
        title: "New Task",
        description: "Task description",
      };

      const createdTask = {
        ...personalTask,
        title: input.title,
        description: input.description,
      };

      mockPrisma.task.create.mockResolvedValue(createdTask);

      const result = await createTask(userId, input);

      expect(mockPrisma.task.create).toHaveBeenCalledWith({
        data: {
          title: input.title,
          description: input.description,
          dueDate: undefined,
          projectId: undefined,
          creatorId: userId,
          assigneeId: undefined,
        },
      });

      expect(result).toEqual(createdTask);
    });

    it("should create a project task when user is a project member", async () => {
      const input = {
        title: "Project Task",
        projectId,
      };

      mockPrisma.project.findUnique.mockResolvedValue({
        id: projectId,
      });

      mockPrisma.projectMember.findUnique.mockResolvedValue({
        projectId,
        userId,
        role: "MEMBER",
      });

      mockPrisma.task.create.mockResolvedValue(projectTask);

      const result = await createTask(userId, input);

      expect(mockPrisma.project.findUnique).toHaveBeenCalledWith({
        where: {
          id: projectId,
        },
      });

      expect(mockPrisma.projectMember.findUnique).toHaveBeenCalledWith({
        where: {
          projectId_userId: {
            projectId,
            userId,
          },
        },
      });

      expect(result).toEqual(projectTask);
    });

    it("should throw 404 when project does not exist", async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      await expect(
        createTask(userId, {
          title: "Project Task",
          projectId,
        })
      ).rejects.toEqual(new AppError("Project not found", 404));

      expect(mockPrisma.task.create).not.toHaveBeenCalled();
    });

    it("should throw 403 when user is not a project member", async () => {
      mockPrisma.project.findUnique.mockResolvedValue({
        id: projectId,
      });

      mockPrisma.projectMember.findUnique.mockResolvedValue(null);

      await expect(
        createTask(userId, {
          title: "Project Task",
          projectId,
        })
      ).rejects.toEqual(new AppError("You are not a member of this project", 403));

      expect(mockPrisma.task.create).not.toHaveBeenCalled();
    });

    it("should throw 400 when project assignee is not a project member", async () => {
      mockPrisma.project.findUnique.mockResolvedValue({
        id: projectId,
      });

      mockPrisma.projectMember.findUnique
        .mockResolvedValueOnce({
          projectId,
          userId,
          role: "MEMBER",
        })
        .mockResolvedValueOnce(null);

      await expect(
        createTask(userId, {
          title: "Project Task",
          projectId,
          assigneeId,
        })
      ).rejects.toEqual(new AppError("Assignee is not a member of this project", 400));

      expect(mockPrisma.task.create).not.toHaveBeenCalled();
    });

    it("should throw 404 when personal task assignee does not exist", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        createTask(userId, {
          title: "Personal Task",
          assigneeId,
        })
      ).rejects.toEqual(new AppError("Assignee not found", 404));

      expect(mockPrisma.task.create).not.toHaveBeenCalled();
    });

    it("should create a personal task with a valid assignee", async () => {
      const createdTask = {
        ...personalTask,
        assigneeId,
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: assigneeId,
      });

      mockPrisma.task.create.mockResolvedValue(createdTask);

      const result = await createTask(userId, {
        title: "Assigned Task",
        assigneeId,
      });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: assigneeId,
        },
      });

      expect(result).toEqual(createdTask);

      expect(mockSendToUser).toHaveBeenCalledWith(assigneeId, {
        type: "TASK_CREATED",
        message: "A new task has been created for you",
        data: createdTask,
      });
    });
  });

  // ============================================================
  // GET TASK BY ID
  // ============================================================

  describe("getTaskById", () => {
    it("should return a task when it exists", async () => {
      mockPrisma.task.findUnique.mockResolvedValue(personalTask);

      const result = await getTaskById(taskId, userId);

      expect(result).toEqual(personalTask);
    });

    it("should throw 404 when task does not exist", async () => {
      mockPrisma.task.findUnique.mockResolvedValue(null);

      await expect(getTaskById(taskId, userId)).rejects.toEqual(
        new AppError("Task not found", 404)
      );
    });

    it("should allow the personal task creator to view the task", async () => {
      mockPrisma.task.findUnique.mockResolvedValue(personalTask);

      const result = await getTaskById(taskId, userId);

      expect(result).toEqual(personalTask);
    });

    it("should allow the personal task assignee to view the task", async () => {
      const task = {
        ...personalTask,
        creatorId: anotherUserId,
        assigneeId: userId,
      };

      mockPrisma.task.findUnique.mockResolvedValue(task);

      const result = await getTaskById(taskId, userId);

      expect(result).toEqual(task);
    });

    it("should throw 403 when user cannot view a personal task", async () => {
      mockPrisma.task.findUnique.mockResolvedValue(personalTask);

      await expect(getTaskById(taskId, anotherUserId)).rejects.toEqual(
        new AppError("You are not authorized to view this task", 403)
      );
    });

    it("should allow a project member to view a project task", async () => {
      mockPrisma.task.findUnique.mockResolvedValue(projectTask);

      mockPrisma.projectMember.findUnique.mockResolvedValue({
        projectId,
        userId,
        role: "MEMBER",
      });

      const result = await getTaskById(taskId, userId);

      expect(result).toEqual(projectTask);
    });

    it("should throw 403 when user is not a project member", async () => {
      mockPrisma.task.findUnique.mockResolvedValue(projectTask);

      mockPrisma.projectMember.findUnique.mockResolvedValue(null);

      await expect(getTaskById(taskId, anotherUserId)).rejects.toEqual(
        new AppError("You are not a member of this project", 403)
      );
    });
  });

  // ============================================================
  // GET TASKS
  // ============================================================

  describe("getTasks", () => {
    it("should return visible tasks with pagination", async () => {
      const tasks = [personalTask, projectTask];

      mockPrisma.projectMember.findMany.mockResolvedValue([
        {
          projectId,
        },
      ]);

      mockPrisma.task.findMany.mockResolvedValue(tasks);
      mockPrisma.task.count.mockResolvedValue(2);

      const result = await getTasks(userId);

      expect(mockPrisma.projectMember.findMany).toHaveBeenCalledWith({
        where: {
          userId,
        },
        select: {
          projectId: true,
        },
      });

      expect(mockPrisma.task.findMany).toHaveBeenCalled();
      expect(mockPrisma.task.count).toHaveBeenCalled();

      expect(result).toEqual({
        tasks,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      });
    });

    it("should apply status, project, assignee, creator and search filters", async () => {
      mockPrisma.projectMember.findMany.mockResolvedValue([
        {
          projectId,
        },
      ]);

      mockPrisma.task.findMany.mockResolvedValue([]);
      mockPrisma.task.count.mockResolvedValue(0);

      await getTasks(userId, {
        status: TaskStatus.COMPLETED,
        projectId,
        assigneeId,
        creatorId: anotherUserId,
        search: "test",
      });

      const findManyCall = mockPrisma.task.findMany.mock.calls[0][0];

      expect(findManyCall.where.AND).toEqual(
        expect.arrayContaining([
          {
            status: TaskStatus.COMPLETED,
          },
          {
            projectId,
          },
          {
            assigneeId,
          },
          {
            creatorId: anotherUserId,
          },
          {
            OR: [
              {
                title: {
                  contains: "test",
                  mode: "insensitive",
                },
              },
              {
                description: {
                  contains: "test",
                  mode: "insensitive",
                },
              },
            ],
          },
        ])
      );
    });

    it("should apply pagination and sorting", async () => {
      mockPrisma.projectMember.findMany.mockResolvedValue([]);

      mockPrisma.task.findMany.mockResolvedValue([]);
      mockPrisma.task.count.mockResolvedValue(25);

      const result = await getTasks(userId, {
        page: 2,
        limit: 5,
        sortBy: "title",
        sortOrder: "asc",
      });

      const findManyCall = mockPrisma.task.findMany.mock.calls[0][0];

      expect(findManyCall.skip).toBe(5);
      expect(findManyCall.take).toBe(5);

      expect(findManyCall.orderBy).toEqual({
        title: "asc",
      });

      expect(result.pagination).toEqual({
        page: 2,
        limit: 5,
        total: 25,
        totalPages: 5,
      });
    });
  });

  // ============================================================
  // UPDATE TASK
  // ============================================================

  describe("updateTask", () => {
    it("should throw 404 when task does not exist", async () => {
      mockPrisma.task.findUnique.mockResolvedValue(null);

      await expect(
        updateTask(taskId, userId, {
          title: "Updated Task",
        })
      ).rejects.toEqual(new AppError("Task not found", 404));
    });

    it("should update a personal task when user is creator", async () => {
      const updatedTask = {
        ...personalTask,
        title: "Updated Task",
      };

      mockPrisma.task.findUnique.mockResolvedValue(personalTask);
      mockPrisma.task.update.mockResolvedValue(updatedTask);

      const result = await updateTask(taskId, userId, {
        title: "Updated Task",
      });

      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: {
          id: taskId,
        },
        data: {
          title: "Updated Task",
          description: undefined,
          dueDate: undefined,
          assigneeId: undefined,
        },
      });

      expect(result).toEqual(updatedTask);
    });

    it("should throw 403 when user cannot update a personal task", async () => {
      mockPrisma.task.findUnique.mockResolvedValue(personalTask);

      await expect(
        updateTask(taskId, anotherUserId, {
          title: "Updated Task",
        })
      ).rejects.toEqual(new AppError("You are not authorized to update this task", 403));
    });

    it("should throw 403 when user is not a project member", async () => {
      mockPrisma.task.findUnique.mockResolvedValue(projectTask);
      mockPrisma.projectMember.findUnique.mockResolvedValue(null);

      await expect(
        updateTask(taskId, anotherUserId, {
          title: "Updated Task",
        })
      ).rejects.toEqual(new AppError("You are not a member of this project", 403));
    });

    it("should update a project task for a project member", async () => {
      const updatedTask = {
        ...projectTask,
        title: "Updated Project Task",
        assigneeId,
      };

      mockPrisma.task.findUnique.mockResolvedValue(projectTask);

      mockPrisma.projectMember.findUnique
        .mockResolvedValueOnce({
          projectId,
          userId,
          role: "MEMBER",
        })
        .mockResolvedValueOnce({
          projectId,
          userId: assigneeId,
          role: "MEMBER",
        });

      mockPrisma.task.update.mockResolvedValue(updatedTask);

      const result = await updateTask(taskId, userId, {
        title: "Updated Project Task",
        assigneeId,
      });

      expect(result).toEqual(updatedTask);
    });

    it("should throw 400 when project assignee is not a member", async () => {
      mockPrisma.task.findUnique.mockResolvedValue(projectTask);

      mockPrisma.projectMember.findUnique
        .mockResolvedValueOnce({
          projectId,
          userId,
          role: "MEMBER",
        })
        .mockResolvedValueOnce(null);

      await expect(
        updateTask(taskId, userId, {
          assigneeId,
        })
      ).rejects.toEqual(new AppError("Assignee is not a member of this project", 400));

      expect(mockPrisma.task.update).not.toHaveBeenCalled();
    });

    it("should throw 404 when personal task assignee does not exist", async () => {
      mockPrisma.task.findUnique.mockResolvedValue(personalTask);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        updateTask(taskId, userId, {
          assigneeId,
        })
      ).rejects.toEqual(new AppError("Assignee not found", 404));

      expect(mockPrisma.task.update).not.toHaveBeenCalled();
    });

    it("should allow clearing the assignee on a personal task", async () => {
      const updatedTask = {
        ...personalTask,
        assigneeId: null,
      };

      mockPrisma.task.findUnique.mockResolvedValue(personalTask);
      mockPrisma.task.update.mockResolvedValue(updatedTask);

      const result = await updateTask(taskId, userId, {
        assigneeId: null,
      });

      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: {
          id: taskId,
        },
        data: {
          title: undefined,
          description: undefined,
          dueDate: undefined,
          assigneeId: null,
        },
      });

      expect(result).toEqual(updatedTask);
    });
  });

  // ============================================================
  // DELETE TASK
  // ============================================================

  describe("deleteTask", () => {
    it("should throw 404 when task does not exist", async () => {
      mockPrisma.task.findUnique.mockResolvedValue(null);

      await expect(deleteTask(taskId, userId)).rejects.toEqual(new AppError("Task not found", 404));
    });

    it("should throw 403 when user is not creator of personal task", async () => {
      mockPrisma.task.findUnique.mockResolvedValue(personalTask);

      await expect(deleteTask(taskId, anotherUserId)).rejects.toEqual(
        new AppError("Only the task creator can delete this task", 403)
      );

      expect(mockPrisma.task.delete).not.toHaveBeenCalled();
    });

    it("should delete a personal task when user is creator", async () => {
      mockPrisma.task.findUnique.mockResolvedValue(personalTask);
      mockPrisma.task.delete.mockResolvedValue(personalTask);

      await deleteTask(taskId, userId);

      expect(mockPrisma.task.delete).toHaveBeenCalledWith({
        where: {
          id: taskId,
        },
      });
    });

    it("should throw 403 when user is not a project member", async () => {
      mockPrisma.task.findUnique.mockResolvedValue(projectTask);
      mockPrisma.projectMember.findUnique.mockResolvedValue(null);

      await expect(deleteTask(taskId, anotherUserId)).rejects.toEqual(
        new AppError("You are not a member of this project", 403)
      );

      expect(mockPrisma.task.delete).not.toHaveBeenCalled();
    });

    it("should delete a project task when user is a project member", async () => {
      mockPrisma.task.findUnique.mockResolvedValue(projectTask);

      mockPrisma.projectMember.findUnique.mockResolvedValue({
        projectId,
        userId,
        role: "MEMBER",
      });

      mockPrisma.task.delete.mockResolvedValue(projectTask);

      await deleteTask(taskId, userId);

      expect(mockPrisma.task.delete).toHaveBeenCalledWith({
        where: {
          id: taskId,
        },
      });
    });
  });

  // ============================================================
  // ASSIGN TASK
  // ============================================================

  describe("assignTask", () => {
    it("should throw 404 when task does not exist", async () => {
      mockPrisma.task.findUnique.mockResolvedValue(null);

      await expect(assignTask(taskId, userId, assigneeId)).rejects.toEqual(
        new AppError("Task not found", 404)
      );
    });

    it("should throw 403 when non-creator tries to assign personal task", async () => {
      mockPrisma.task.findUnique.mockResolvedValue(personalTask);

      await expect(assignTask(taskId, anotherUserId, assigneeId)).rejects.toEqual(
        new AppError("Only the task creator can assign this task", 403)
      );
    });

    it("should throw 404 when personal task assignee does not exist", async () => {
      mockPrisma.task.findUnique.mockResolvedValue(personalTask);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(assignTask(taskId, userId, assigneeId)).rejects.toEqual(
        new AppError("Assignee not found", 404)
      );

      expect(mockPrisma.task.update).not.toHaveBeenCalled();
    });

    it("should assign a personal task successfully", async () => {
      const updatedTask = {
        ...personalTask,
        assigneeId,
      };

      mockPrisma.task.findUnique.mockResolvedValue(personalTask);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: assigneeId,
      });

      mockPrisma.task.update.mockResolvedValue(updatedTask);

      const result = await assignTask(taskId, userId, assigneeId);

      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: {
          id: taskId,
        },
        data: {
          assigneeId,
        },
      });

      expect(result).toEqual(updatedTask);
    });

    it("should throw 403 when project requester is not a member", async () => {
      mockPrisma.task.findUnique.mockResolvedValue(projectTask);

      mockPrisma.projectMember.findUnique.mockResolvedValue(null);

      await expect(assignTask(taskId, anotherUserId, assigneeId)).rejects.toEqual(
        new AppError("You are not a member of this project", 403)
      );
    });

    it("should throw 400 when project assignee is not a member", async () => {
      mockPrisma.task.findUnique.mockResolvedValue(projectTask);

      mockPrisma.projectMember.findUnique
        .mockResolvedValueOnce({
          projectId,
          userId,
          role: "MEMBER",
        })
        .mockResolvedValueOnce(null);

      await expect(assignTask(taskId, userId, assigneeId)).rejects.toEqual(
        new AppError("Assignee is not a member of this project", 400)
      );

      expect(mockPrisma.task.update).not.toHaveBeenCalled();
    });

    it("should assign a project task successfully", async () => {
      const updatedTask = {
        ...projectTask,
        assigneeId,
      };

      mockPrisma.task.findUnique.mockResolvedValue(projectTask);

      mockPrisma.projectMember.findUnique
        .mockResolvedValueOnce({
          projectId,
          userId,
          role: "MEMBER",
        })
        .mockResolvedValueOnce({
          projectId,
          userId: assigneeId,
          role: "MEMBER",
        });

      mockPrisma.task.update.mockResolvedValue(updatedTask);

      const result = await assignTask(taskId, userId, assigneeId);

      expect(result).toEqual(updatedTask);

      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: {
          id: taskId,
        },
        data: {
          assigneeId,
        },
      });
    });
  });

  // ============================================================
  // UPDATE TASK STATUS
  // ============================================================

  describe("updateTaskStatus", () => {
    it("should throw 404 when task does not exist", async () => {
      mockPrisma.task.findUnique.mockResolvedValue(null);

      await expect(updateTaskStatus(taskId, userId, TaskStatus.COMPLETED)).rejects.toEqual(
        new AppError("Task not found", 404)
      );
    });

    it("should throw 400 when task already has requested status", async () => {
      mockPrisma.task.findUnique.mockResolvedValue({
        ...personalTask,
        status: TaskStatus.COMPLETED,
      });

      await expect(updateTaskStatus(taskId, userId, TaskStatus.COMPLETED)).rejects.toEqual(
        new AppError(`Task is already ${TaskStatus.COMPLETED}`, 400)
      );
    });

    it("should throw 403 when user cannot update personal task status", async () => {
      mockPrisma.task.findUnique.mockResolvedValue(personalTask);

      await expect(updateTaskStatus(taskId, anotherUserId, TaskStatus.COMPLETED)).rejects.toEqual(
        new AppError("You are not authorized to update this task", 403)
      );
    });

    it("should update personal task status successfully", async () => {
      const updatedTask = {
        ...personalTask,
        status: TaskStatus.COMPLETED,
      };

      mockPrisma.task.findUnique.mockResolvedValue(personalTask);
      mockPrisma.task.update.mockResolvedValue(updatedTask);

      const result = await updateTaskStatus(taskId, userId, TaskStatus.COMPLETED);

      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: {
          id: taskId,
        },
        data: {
          status: TaskStatus.COMPLETED,
        },
      });

      expect(result).toEqual(updatedTask);
    });

    it("should throw 403 when user is not a project member", async () => {
      mockPrisma.task.findUnique.mockResolvedValue(projectTask);
      mockPrisma.projectMember.findUnique.mockResolvedValue(null);

      await expect(updateTaskStatus(taskId, anotherUserId, TaskStatus.COMPLETED)).rejects.toEqual(
        new AppError("You are not a member of this project", 403)
      );
    });

    it("should update project task status for project member", async () => {
      const updatedTask = {
        ...projectTask,
        status: TaskStatus.IN_PROGRESS,
      };

      mockPrisma.task.findUnique.mockResolvedValue(projectTask);

      mockPrisma.projectMember.findUnique.mockResolvedValue({
        projectId,
        userId,
        role: "MEMBER",
      });

      mockPrisma.task.update.mockResolvedValue(updatedTask);

      const result = await updateTaskStatus(taskId, userId, TaskStatus.IN_PROGRESS);

      expect(result).toEqual(updatedTask);

      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: {
          id: taskId,
        },
        data: {
          status: TaskStatus.IN_PROGRESS,
        },
      });
    });
  });
});
