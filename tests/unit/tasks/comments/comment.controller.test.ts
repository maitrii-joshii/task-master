import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../../../src/middleware/auth.middleware";

import {
  createComment,
  getTaskComments,
  getCommentById,
  updateComment,
  deleteComment,
} from "../../../../src/modules/tasks/comments/comment.service";

import {
  createCommentController,
  getTaskCommentsController,
  getCommentByIdController,
  updateCommentController,
  deleteCommentController,
} from "../../../../src/modules/tasks/comments/comment.controller";

jest.mock("../../../../src/modules/tasks/comments/comment.service", () => ({
  createComment: jest.fn(),
  getTaskComments: jest.fn(),
  getCommentById: jest.fn(),
  updateComment: jest.fn(),
  deleteComment: jest.fn(),
}));

const mockedCreateComment = createComment as jest.MockedFunction<typeof createComment>;

const mockedGetTaskComments = getTaskComments as jest.MockedFunction<typeof getTaskComments>;

const mockedGetCommentById = getCommentById as jest.MockedFunction<typeof getCommentById>;

const mockedUpdateComment = updateComment as jest.MockedFunction<typeof updateComment>;

const mockedDeleteComment = deleteComment as jest.MockedFunction<typeof deleteComment>;

const createResponseMock = () => {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
    send: jest.fn(),
  } as unknown as Response;

  (res.status as jest.Mock).mockReturnValue(res);
  (res.json as jest.Mock).mockReturnValue(res);
  (res.send as jest.Mock).mockReturnValue(res);

  return res;
};

const createRequestMock = (overrides: Partial<AuthenticatedRequest> = {}): AuthenticatedRequest => {
  return {
    userId: "11111111-1111-4111-8111-111111111111",
    body: {},
    params: {},
    ...overrides,
  } as AuthenticatedRequest;
};

describe("Comment Controllers", () => {
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    res = createResponseMock();
    next = jest.fn();
  });

  describe("createCommentController", () => {
    it("should create a comment and return 201", async () => {
      const taskId = "22222222-2222-4222-8222-222222222222";

      const req = createRequestMock({
        params: {
          taskId,
        },
        body: {
          content: "Test comment",
        },
      });

      const comment = {
        id: "33333333-3333-4333-8333-333333333333",
        taskId,
        authorId: req.userId,
        content: "Test comment",
      };

      mockedCreateComment.mockResolvedValue(comment as never);

      await createCommentController(req, res, next);

      expect(mockedCreateComment).toHaveBeenCalledWith(taskId, req.userId, "Test comment");

      expect(res.status).toHaveBeenCalledWith(201);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: comment,
      });

      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 when user is not authenticated", async () => {
      const req = createRequestMock({
        userId: undefined,
      });

      await createCommentController(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);

      expect(next).not.toHaveBeenCalled();
      expect(mockedCreateComment).not.toHaveBeenCalled();
    });

    it("should pass service errors to next", async () => {
      const error = new Error("Task not found");

      const req = createRequestMock({
        params: {
          taskId: "22222222-2222-4222-8222-222222222222",
        },
        body: {
          content: "Test comment",
        },
      });

      mockedCreateComment.mockRejectedValue(error);

      await createCommentController(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("getTaskCommentsController", () => {
    it("should return task comments with 200", async () => {
      const taskId = "22222222-2222-4222-8222-222222222222";

      const req = createRequestMock({
        params: {
          taskId,
        },
      });

      const comments = [
        {
          id: "33333333-3333-4333-8333-333333333333",
          taskId,
          authorId: req.userId,
          content: "Test comment",
        },
      ];

      mockedGetTaskComments.mockResolvedValue(comments as never);

      await getTaskCommentsController(req, res, next);

      expect(mockedGetTaskComments).toHaveBeenCalledWith(taskId, req.userId);

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: comments,
      });
    });

    it("should return 401 when user is not authenticated", async () => {
      const req = createRequestMock({
        userId: undefined,
      });

      await getTaskCommentsController(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(mockedGetTaskComments).not.toHaveBeenCalled();
    });

    it("should pass service errors to next", async () => {
      const error = new Error("Task not found");

      const req = createRequestMock({
        params: {
          taskId: "22222222-2222-4222-8222-222222222222",
        },
      });

      mockedGetTaskComments.mockRejectedValue(error);

      await getTaskCommentsController(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("getCommentByIdController", () => {
    it("should return a comment with 200", async () => {
      const taskId = "22222222-2222-4222-8222-222222222222";
      const commentId = "33333333-3333-4333-8333-333333333333";

      const req = createRequestMock({
        params: {
          taskId,
          commentId,
        },
      });

      const comment = {
        id: commentId,
        taskId,
        authorId: req.userId,
        content: "Test comment",
      };

      mockedGetCommentById.mockResolvedValue(comment as never);

      await getCommentByIdController(req, res, next);

      expect(mockedGetCommentById).toHaveBeenCalledWith(taskId, commentId, req.userId);

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: comment,
      });
    });

    it("should pass service errors to next", async () => {
      const error = new Error("Comment not found");

      const req = createRequestMock({
        params: {
          taskId: "22222222-2222-4222-8222-222222222222",
          commentId: "33333333-3333-4333-8333-333333333333",
        },
      });

      mockedGetCommentById.mockRejectedValue(error);

      await getCommentByIdController(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("updateCommentController", () => {
    it("should update a comment and return 200", async () => {
      const taskId = "22222222-2222-4222-8222-222222222222";
      const commentId = "33333333-3333-4333-8333-333333333333";

      const req = createRequestMock({
        params: {
          taskId,
          commentId,
        },
        body: {
          content: "Updated comment",
        },
      });

      const updatedComment = {
        id: commentId,
        taskId,
        authorId: req.userId,
        content: "Updated comment",
      };

      mockedUpdateComment.mockResolvedValue(updatedComment as never);

      await updateCommentController(req, res, next);

      expect(mockedUpdateComment).toHaveBeenCalledWith(
        taskId,
        commentId,
        req.userId,
        "Updated comment"
      );

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: updatedComment,
      });
    });

    it("should pass service errors to next", async () => {
      const error = new Error("You can only update your own comments");

      const req = createRequestMock({
        params: {
          taskId: "22222222-2222-4222-8222-222222222222",
          commentId: "33333333-3333-4333-8333-333333333333",
        },
        body: {
          content: "Updated comment",
        },
      });

      mockedUpdateComment.mockRejectedValue(error);

      await updateCommentController(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("deleteCommentController", () => {
    it("should delete a comment and return 204", async () => {
      const taskId = "22222222-2222-4222-8222-222222222222";
      const commentId = "33333333-3333-4333-8333-333333333333";

      const req = createRequestMock({
        params: {
          taskId,
          commentId,
        },
      });

      mockedDeleteComment.mockResolvedValue(undefined);

      await deleteCommentController(req, res, next);

      expect(mockedDeleteComment).toHaveBeenCalledWith(taskId, commentId, req.userId);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();

      expect(next).not.toHaveBeenCalled();
    });

    it("should pass service errors to next", async () => {
      const error = new Error("You can only delete your own comments");

      const req = createRequestMock({
        params: {
          taskId: "22222222-2222-4222-8222-222222222222",
          commentId: "33333333-3333-4333-8333-333333333333",
        },
      });

      mockedDeleteComment.mockRejectedValue(error);

      await deleteCommentController(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
