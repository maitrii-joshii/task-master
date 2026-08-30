import prisma from "../../../../src/config/prisma";
import { AppError } from "../../../../src/utils/appError";
import {
  createComment,
  getTaskComments,
  getCommentById,
  updateComment,
  deleteComment,
} from "../../../../src/modules/tasks/comments/comment.service";

jest.mock("../../../../src/config/prisma", () => ({
  __esModule: true,
  default: {
    task: {
      findUnique: jest.fn(),
    },
    comment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

const userId = "11111111-1111-4111-8111-111111111111";
const taskId = "22222222-2222-4222-8222-222222222222";
const commentId = "33333333-3333-4333-8333-333333333333";
const otherUserId = "44444444-4444-4444-8444-444444444444";

const author = {
  id: userId,
  name: "Test User",
  email: "test@example.com",
};

const comment = {
  id: commentId,
  content: "Test comment",
  taskId,
  authorId: userId,
  author,
};

describe("Comment Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createComment", () => {
    it("should create a comment when user has access to the task", async () => {
      const task = {
        id: taskId,
        creatorId: userId,
        assigneeId: null,
        project: null,
      };

      (mockedPrisma.task.findUnique as jest.Mock).mockResolvedValue(task);

      (mockedPrisma.comment.create as jest.Mock).mockResolvedValue(comment);

      const result = await createComment(taskId, userId, "Test comment");

      expect(mockedPrisma.task.findUnique).toHaveBeenCalledWith({
        where: {
          id: taskId,
        },
        include: {
          project: {
            include: {
              members: {
                where: {
                  userId,
                },
                select: {
                  id: true,
                },
              },
            },
          },
        },
      });

      expect(mockedPrisma.comment.create).toHaveBeenCalledWith({
        data: {
          content: "Test comment",
          taskId,
          authorId: userId,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      expect(result).toEqual(comment);
    });

    it("should allow the task assignee to create a comment", async () => {
      const task = {
        id: taskId,
        creatorId: otherUserId,
        assigneeId: userId,
        project: null,
      };

      (mockedPrisma.task.findUnique as jest.Mock).mockResolvedValue(task);

      (mockedPrisma.comment.create as jest.Mock).mockResolvedValue(comment);

      const result = await createComment(taskId, userId, "Assignee comment");

      expect(result).toEqual(comment);
      expect(mockedPrisma.comment.create).toHaveBeenCalled();
    });

    it("should allow a project member to create a comment", async () => {
      const task = {
        id: taskId,
        creatorId: otherUserId,
        assigneeId: null,
        project: {
          members: [{ id: "55555555-5555-4555-8555-555555555555" }],
        },
      };

      (mockedPrisma.task.findUnique as jest.Mock).mockResolvedValue(task);

      (mockedPrisma.comment.create as jest.Mock).mockResolvedValue(comment);

      const result = await createComment(taskId, userId, "Project member comment");

      expect(result).toEqual(comment);
    });

    it("should throw 404 when task does not exist", async () => {
      (mockedPrisma.task.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(createComment(taskId, userId, "Test comment")).rejects.toMatchObject({
        message: "Task not found",
        statusCode: 404,
      });

      expect(mockedPrisma.comment.create).not.toHaveBeenCalled();
    });

    it("should throw 403 when user does not have access to the task", async () => {
      const task = {
        id: taskId,
        creatorId: otherUserId,
        assigneeId: otherUserId,
        project: null,
      };

      (mockedPrisma.task.findUnique as jest.Mock).mockResolvedValue(task);

      await expect(createComment(taskId, userId, "Test comment")).rejects.toMatchObject({
        message: "User is not authorized to comment on this task",
        statusCode: 403,
      });

      expect(mockedPrisma.comment.create).not.toHaveBeenCalled();
    });
  });

  describe("getTaskComments", () => {
    it("should return all comments when user has access", async () => {
      const task = {
        id: taskId,
        creatorId: userId,
        assigneeId: null,
        project: null,
      };

      const comments = [comment];

      (mockedPrisma.task.findUnique as jest.Mock).mockResolvedValue(task);

      (mockedPrisma.comment.findMany as jest.Mock).mockResolvedValue(comments);

      const result = await getTaskComments(taskId, userId);

      expect(mockedPrisma.comment.findMany).toHaveBeenCalledWith({
        where: {
          taskId,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      expect(result).toEqual(comments);
    });

    it("should allow an assignee to view comments", async () => {
      const task = {
        id: taskId,
        creatorId: otherUserId,
        assigneeId: userId,
        project: null,
      };

      (mockedPrisma.task.findUnique as jest.Mock).mockResolvedValue(task);

      (mockedPrisma.comment.findMany as jest.Mock).mockResolvedValue([comment]);

      const result = await getTaskComments(taskId, userId);

      expect(result).toEqual([comment]);
    });

    it("should allow a project member to view comments", async () => {
      const task = {
        id: taskId,
        creatorId: otherUserId,
        assigneeId: null,
        project: {
          members: [{ id: "55555555-5555-4555-8555-555555555555" }],
        },
      };

      (mockedPrisma.task.findUnique as jest.Mock).mockResolvedValue(task);

      (mockedPrisma.comment.findMany as jest.Mock).mockResolvedValue([comment]);

      const result = await getTaskComments(taskId, userId);

      expect(result).toEqual([comment]);
    });

    it("should throw 404 when task does not exist", async () => {
      (mockedPrisma.task.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(getTaskComments(taskId, userId)).rejects.toMatchObject({
        message: "Task not found",
        statusCode: 404,
      });

      expect(mockedPrisma.comment.findMany).not.toHaveBeenCalled();
    });

    it("should throw 403 when user cannot view task comments", async () => {
      const task = {
        id: taskId,
        creatorId: otherUserId,
        assigneeId: otherUserId,
        project: null,
      };

      (mockedPrisma.task.findUnique as jest.Mock).mockResolvedValue(task);

      await expect(getTaskComments(taskId, userId)).rejects.toMatchObject({
        message: "User is not authorized to view comments",
        statusCode: 403,
      });

      expect(mockedPrisma.comment.findMany).not.toHaveBeenCalled();
    });
  });

  describe("getCommentById", () => {
    it("should return a comment when user has access", async () => {
      const resultComment = {
        ...comment,
        task: {
          creatorId: userId,
          assigneeId: null,
          project: null,
        },
      };

      (mockedPrisma.comment.findFirst as jest.Mock).mockResolvedValue(resultComment);

      const result = await getCommentById(taskId, commentId, userId);

      expect(mockedPrisma.comment.findFirst).toHaveBeenCalledWith({
        where: {
          id: commentId,
          taskId,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          task: {
            select: {
              creatorId: true,
              assigneeId: true,
              project: {
                select: {
                  members: {
                    where: {
                      userId,
                    },
                    select: {
                      id: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      expect(result).toEqual(resultComment);
    });

    it("should throw 404 when comment does not exist", async () => {
      (mockedPrisma.comment.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(getCommentById(taskId, commentId, userId)).rejects.toMatchObject({
        message: "Comment not found",
        statusCode: 404,
      });
    });

    it("should throw 403 when user cannot view the comment", async () => {
      const resultComment = {
        ...comment,
        task: {
          creatorId: otherUserId,
          assigneeId: otherUserId,
          project: null,
        },
      };

      (mockedPrisma.comment.findFirst as jest.Mock).mockResolvedValue(resultComment);

      await expect(getCommentById(taskId, commentId, userId)).rejects.toMatchObject({
        message: "User is not authorized to view this comment",
        statusCode: 403,
      });
    });
  });

  describe("updateComment", () => {
    it("should update the user's own comment", async () => {
      const existingComment = {
        id: commentId,
        taskId,
        authorId: userId,
        content: "Old comment",
      };

      const updatedComment = {
        ...comment,
        content: "Updated comment",
      };

      (mockedPrisma.comment.findFirst as jest.Mock).mockResolvedValue(existingComment);

      (mockedPrisma.comment.update as jest.Mock).mockResolvedValue(updatedComment);

      const result = await updateComment(taskId, commentId, userId, "Updated comment");

      expect(mockedPrisma.comment.update).toHaveBeenCalledWith({
        where: {
          id: commentId,
        },
        data: {
          content: "Updated comment",
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      expect(result).toEqual(updatedComment);
    });

    it("should throw 404 when comment does not exist", async () => {
      (mockedPrisma.comment.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        updateComment(taskId, commentId, userId, "Updated comment")
      ).rejects.toMatchObject({
        message: "Comment not found",
        statusCode: 404,
      });

      expect(mockedPrisma.comment.update).not.toHaveBeenCalled();
    });

    it("should throw 403 when user is not the comment author", async () => {
      const existingComment = {
        id: commentId,
        taskId,
        authorId: otherUserId,
        content: "Original comment",
      };

      (mockedPrisma.comment.findFirst as jest.Mock).mockResolvedValue(existingComment);

      await expect(
        updateComment(taskId, commentId, userId, "Updated comment")
      ).rejects.toMatchObject({
        message: "You can only update your own comments",
        statusCode: 403,
      });

      expect(mockedPrisma.comment.update).not.toHaveBeenCalled();
    });
  });

  describe("deleteComment", () => {
    it("should delete the user's own comment", async () => {
      const existingComment = {
        id: commentId,
        taskId,
        authorId: userId,
        content: "Test comment",
      };

      (mockedPrisma.comment.findFirst as jest.Mock).mockResolvedValue(existingComment);

      (mockedPrisma.comment.delete as jest.Mock).mockResolvedValue(existingComment);

      await deleteComment(taskId, commentId, userId);

      expect(mockedPrisma.comment.delete).toHaveBeenCalledWith({
        where: {
          id: commentId,
        },
      });
    });

    it("should throw 404 when comment does not exist", async () => {
      (mockedPrisma.comment.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(deleteComment(taskId, commentId, userId)).rejects.toMatchObject({
        message: "Comment not found",
        statusCode: 404,
      });

      expect(mockedPrisma.comment.delete).not.toHaveBeenCalled();
    });

    it("should throw 403 when user is not the comment author", async () => {
      const existingComment = {
        id: commentId,
        taskId,
        authorId: otherUserId,
        content: "Test comment",
      };

      (mockedPrisma.comment.findFirst as jest.Mock).mockResolvedValue(existingComment);

      await expect(deleteComment(taskId, commentId, userId)).rejects.toMatchObject({
        message: "You can only delete your own comments",
        statusCode: 403,
      });

      expect(mockedPrisma.comment.delete).not.toHaveBeenCalled();
    });
  });
});
