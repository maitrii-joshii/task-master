import { NextFunction, Response } from "express";

import {
  assignTask,
  createTask,
  deleteTask,
  getTaskById,
  getTasks,
  updateTask,
  updateTaskStatus,
} from "../../../src/modules/tasks/task.service";

import {
  assignTaskSchema,
  createTaskSchema,
  taskFilterSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
} from "../../../src/modules/tasks/task.schema";

import {
  assignTaskController,
  createTaskController,
  deleteTaskController,
  getTaskByIdController,
  getTasksController,
  updateTaskController,
  updateTaskStatusController,
} from "../../../src/modules/tasks/task.controller";

import { AuthenticatedRequest } from "../../../src/middleware/auth.middleware";

jest.mock("../../../src/modules/tasks/task.service");

jest.mock("../../../src/modules/tasks/task.schema", () => ({
  createTaskSchema: {
    parse: jest.fn(),
  },
  updateTaskSchema: {
    parse: jest.fn(),
  },
  assignTaskSchema: {
    parse: jest.fn(),
  },
  updateTaskStatusSchema: {
    parse: jest.fn(),
  },
  taskFilterSchema: {
    parse: jest.fn(),
  },
}));

const mockedCreateTask = createTask as jest.MockedFunction<typeof createTask>;
const mockedGetTaskById = getTaskById as jest.MockedFunction<typeof getTaskById>;
const mockedGetTasks = getTasks as jest.MockedFunction<typeof getTasks>;
const mockedUpdateTask = updateTask as jest.MockedFunction<typeof updateTask>;
const mockedDeleteTask = deleteTask as jest.MockedFunction<typeof deleteTask>;
const mockedAssignTask = assignTask as jest.MockedFunction<typeof assignTask>;
const mockedUpdateTaskStatus = updateTaskStatus as jest.MockedFunction<typeof updateTaskStatus>;

const mockedCreateTaskSchema = createTaskSchema.parse as jest.Mock;
const mockedUpdateTaskSchema = updateTaskSchema.parse as jest.Mock;
const mockedAssignTaskSchema = assignTaskSchema.parse as jest.Mock;
const mockedUpdateTaskStatusSchema = updateTaskStatusSchema.parse as jest.Mock;
const mockedTaskFilterSchema = taskFilterSchema.parse as jest.Mock;

describe("Task Controller", () => {
  let req: Partial<AuthenticatedRequest>;
  let res: Partial<Response>;
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      userId: "user-123",
      params: {},
      body: {},
      query: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    next = jest.fn();
  });

  describe("createTaskController", () => {
    it("should create a task successfully", async () => {
      const input = {
        title: "Test Task",
      };

      const task = {
        id: "task-123",
        title: "Test Task",
      };

      req.body = input;

      mockedCreateTaskSchema.mockReturnValue(input);
      mockedCreateTask.mockResolvedValue(task as never);

      await createTaskController(req as AuthenticatedRequest, res as Response, next);

      expect(mockedCreateTaskSchema).toHaveBeenCalledWith(input);
      expect(mockedCreateTask).toHaveBeenCalledWith("user-123", input);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: task,
      });

      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 when user is not authenticated", async () => {
      req.userId = undefined;

      await createTaskController(req as AuthenticatedRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: "Authentication required",
        },
      });

      expect(mockedCreateTask).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it("should call next when service throws an error", async () => {
      const error = new Error("Create task failed");

      mockedCreateTaskSchema.mockReturnValue(req.body);
      mockedCreateTask.mockRejectedValue(error);

      await createTaskController(req as AuthenticatedRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it("should call next when validation fails", async () => {
      const error = new Error("Validation failed");

      mockedCreateTaskSchema.mockImplementation(() => {
        throw error;
      });

      await createTaskController(req as AuthenticatedRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(mockedCreateTask).not.toHaveBeenCalled();
    });
  });

  describe("getTaskByIdController", () => {
    it("should get a task successfully", async () => {
      const task = {
        id: "task-123",
        title: "Test Task",
      };

      req.params = {
        id: "task-123",
      };

      mockedGetTaskById.mockResolvedValue(task as never);

      await getTaskByIdController(req as AuthenticatedRequest, res as Response, next);

      expect(mockedGetTaskById).toHaveBeenCalledWith("task-123", "user-123");

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: task,
      });
    });

    it("should return 401 when user is not authenticated", async () => {
      req.userId = undefined;

      await getTaskByIdController(req as AuthenticatedRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(mockedGetTaskById).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it("should call next when service throws an error", async () => {
      const error = new Error("Task not found");

      req.params = {
        id: "task-123",
      };

      mockedGetTaskById.mockRejectedValue(error);

      await getTaskByIdController(req as AuthenticatedRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("getTasksController", () => {
    it("should get tasks successfully", async () => {
      const filters = {
        page: 1,
        limit: 10,
      };

      const result = {
        tasks: [
          {
            id: "task-123",
            title: "Test Task",
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      req.query = {
        page: "1",
        limit: "10",
      };

      mockedTaskFilterSchema.mockReturnValue(filters);
      mockedGetTasks.mockResolvedValue(result as never);

      await getTasksController(req as AuthenticatedRequest, res as Response, next);

      expect(mockedTaskFilterSchema).toHaveBeenCalledWith(req.query);
      expect(mockedGetTasks).toHaveBeenCalledWith("user-123", filters);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: result.tasks,
        pagination: result.pagination,
      });
    });

    it("should return 401 when user is not authenticated", async () => {
      req.userId = undefined;

      await getTasksController(req as AuthenticatedRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(mockedGetTasks).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it("should call next when validation fails", async () => {
      const error = new Error("Invalid filters");

      mockedTaskFilterSchema.mockImplementation(() => {
        throw error;
      });

      await getTasksController(req as AuthenticatedRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(mockedGetTasks).not.toHaveBeenCalled();
    });

    it("should call next when service throws an error", async () => {
      const error = new Error("Failed to get tasks");

      mockedTaskFilterSchema.mockReturnValue({
        page: 1,
        limit: 10,
      });

      mockedGetTasks.mockRejectedValue(error);

      await getTasksController(req as AuthenticatedRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("updateTaskController", () => {
    it("should update a task successfully", async () => {
      const input = {
        title: "Updated Task",
      };

      const task = {
        id: "task-123",
        title: "Updated Task",
      };

      req.params = {
        id: "task-123",
      };

      req.body = input;

      mockedUpdateTaskSchema.mockReturnValue(input);
      mockedUpdateTask.mockResolvedValue(task as never);

      await updateTaskController(req as AuthenticatedRequest, res as Response, next);

      expect(mockedUpdateTaskSchema).toHaveBeenCalledWith(input);
      expect(mockedUpdateTask).toHaveBeenCalledWith("task-123", "user-123", input);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: task,
      });
    });

    it("should return 401 when user is not authenticated", async () => {
      req.userId = undefined;

      await updateTaskController(req as AuthenticatedRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(mockedUpdateTask).not.toHaveBeenCalled();
    });

    it("should call next when validation fails", async () => {
      const error = new Error("Invalid task");

      mockedUpdateTaskSchema.mockImplementation(() => {
        throw error;
      });

      await updateTaskController(req as AuthenticatedRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(mockedUpdateTask).not.toHaveBeenCalled();
    });

    it("should call next when service throws an error", async () => {
      const error = new Error("Update failed");

      mockedUpdateTaskSchema.mockReturnValue(req.body);
      mockedUpdateTask.mockRejectedValue(error);

      await updateTaskController(req as AuthenticatedRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("deleteTaskController", () => {
    it("should delete a task successfully", async () => {
      req.params = {
        id: "task-123",
      };

      mockedDeleteTask.mockResolvedValue(undefined);

      await deleteTaskController(req as AuthenticatedRequest, res as Response, next);

      expect(mockedDeleteTask).toHaveBeenCalledWith("task-123", "user-123");

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();

      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 when user is not authenticated", async () => {
      req.userId = undefined;

      await deleteTaskController(req as AuthenticatedRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(mockedDeleteTask).not.toHaveBeenCalled();
    });

    it("should call next when service throws an error", async () => {
      const error = new Error("Delete failed");

      mockedDeleteTask.mockRejectedValue(error);

      await deleteTaskController(req as AuthenticatedRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("assignTaskController", () => {
    it("should assign a task successfully", async () => {
      const input = {
        assigneeId: "assignee-123",
      };

      const task = {
        id: "task-123",
        assigneeId: "assignee-123",
      };

      req.params = {
        id: "task-123",
      };

      req.body = input;

      mockedAssignTaskSchema.mockReturnValue(input);
      mockedAssignTask.mockResolvedValue(task as never);

      await assignTaskController(req as AuthenticatedRequest, res as Response, next);

      expect(mockedAssignTaskSchema).toHaveBeenCalledWith(input);
      expect(mockedAssignTask).toHaveBeenCalledWith("task-123", "user-123", "assignee-123");

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: task,
      });
    });

    it("should return 401 when user is not authenticated", async () => {
      req.userId = undefined;

      await assignTaskController(req as AuthenticatedRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(mockedAssignTask).not.toHaveBeenCalled();
    });

    it("should call next when validation fails", async () => {
      const error = new Error("Invalid assignee");

      mockedAssignTaskSchema.mockImplementation(() => {
        throw error;
      });

      await assignTaskController(req as AuthenticatedRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(mockedAssignTask).not.toHaveBeenCalled();
    });

    it("should call next when service throws an error", async () => {
      const error = new Error("Assignment failed");

      mockedAssignTaskSchema.mockReturnValue({
        assigneeId: "assignee-123",
      });

      mockedAssignTask.mockRejectedValue(error);

      await assignTaskController(req as AuthenticatedRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("updateTaskStatusController", () => {
    it("should update task status successfully", async () => {
      const input = {
        status: "COMPLETED",
      };

      const task = {
        id: "task-123",
        status: "COMPLETED",
      };

      req.params = {
        id: "task-123",
      };

      req.body = input;

      mockedUpdateTaskStatusSchema.mockReturnValue(input);
      mockedUpdateTaskStatus.mockResolvedValue(task as never);

      await updateTaskStatusController(req as AuthenticatedRequest, res as Response, next);

      expect(mockedUpdateTaskStatusSchema).toHaveBeenCalledWith(input);
      expect(mockedUpdateTaskStatus).toHaveBeenCalledWith("task-123", "user-123", "COMPLETED");

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: task,
      });
    });

    it("should return 401 when user is not authenticated", async () => {
      req.userId = undefined;

      await updateTaskStatusController(req as AuthenticatedRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(mockedUpdateTaskStatus).not.toHaveBeenCalled();
    });

    it("should call next when validation fails", async () => {
      const error = new Error("Invalid status");

      mockedUpdateTaskStatusSchema.mockImplementation(() => {
        throw error;
      });

      await updateTaskStatusController(req as AuthenticatedRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(mockedUpdateTaskStatus).not.toHaveBeenCalled();
    });

    it("should call next when service throws an error", async () => {
      const error = new Error("Status update failed");

      mockedUpdateTaskStatusSchema.mockReturnValue({
        status: "COMPLETED",
      });

      mockedUpdateTaskStatus.mockRejectedValue(error);

      await updateTaskStatusController(req as AuthenticatedRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
