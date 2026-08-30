import type { Express } from "express";
import { Buffer } from "node:buffer";
import { Response, NextFunction } from "express";

import { AuthenticatedRequest } from "../../../../src/middleware/auth.middleware";

import {
  uploadAttachmentController,
  getTaskAttachmentsController,
  getAttachmentByIdController,
  deleteAttachmentController,
} from "../../../../src/modules/tasks/attachments/attachment.controller";

import {
  uploadAttachment,
  getTaskAttachments,
  getAttachmentById,
  deleteAttachment,
} from "../../../../src/modules/tasks/attachments/attachment.service";

jest.mock("../../../../src/modules/tasks/attachments/attachment.service", () => ({
  uploadAttachment: jest.fn(),
  getTaskAttachments: jest.fn(),
  getAttachmentById: jest.fn(),
  deleteAttachment: jest.fn(),
}));

const mockedUploadAttachment = uploadAttachment as jest.MockedFunction<typeof uploadAttachment>;

const mockedGetTaskAttachments = getTaskAttachments as jest.MockedFunction<
  typeof getTaskAttachments
>;

const mockedGetAttachmentById = getAttachmentById as jest.MockedFunction<typeof getAttachmentById>;

const mockedDeleteAttachment = deleteAttachment as jest.MockedFunction<typeof deleteAttachment>;

describe("Attachment Controllers", () => {
  const userId = "user-123";
  const taskId = "task-123";
  const attachmentId = "attachment-123";

  let req: Partial<AuthenticatedRequest>;
  let res: Partial<Response>;
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      userId,
      params: {
        taskId,
        attachmentId,
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    next = jest.fn();
  });

  // ============================================================
  // uploadAttachmentController
  // ============================================================

  describe("uploadAttachmentController", () => {
    it("should upload attachment successfully", async () => {
      const mockFile = {
        fieldname: "file",
        originalname: "test.pdf",
        encoding: "7bit",
        mimetype: "application/pdf",
        size: 1024,
        destination: "",
        filename: "",
        path: "",
        buffer: Buffer.from("test file"),
        stream: {} as any,
      } as Express.Multer.File;

      const attachment = {
        id: attachmentId,
        fileName: "test.pdf",
        fileUrl: "https://cloudinary.com/test.pdf",
        storageKey: "test-public-id",
        mimeType: "application/pdf",
        fileSize: 1024,
        taskId,
        uploadedById: userId,
      };

      req.file = mockFile;

      mockedUploadAttachment.mockResolvedValue(attachment as any);

      await uploadAttachmentController(req as AuthenticatedRequest, res as Response, next);

      expect(mockedUploadAttachment).toHaveBeenCalledWith(taskId, userId, mockFile);

      expect(res.status).toHaveBeenCalledWith(201);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: attachment,
      });

      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 when user is not authenticated", async () => {
      req.userId = undefined;

      await uploadAttachmentController(req as AuthenticatedRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: "Authentication required",
        },
      });

      expect(mockedUploadAttachment).not.toHaveBeenCalled();

      expect(next).not.toHaveBeenCalled();
    });

    it("should return 400 when file is missing", async () => {
      req.file = undefined;

      await uploadAttachmentController(req as AuthenticatedRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: "File is required",
        },
      });

      expect(mockedUploadAttachment).not.toHaveBeenCalled();

      expect(next).not.toHaveBeenCalled();
    });

    it("should call next when uploadAttachment service throws an error", async () => {
      const mockFile = {
        originalname: "test.pdf",
        mimetype: "application/pdf",
        size: 1024,
        buffer: Buffer.from("test file"),
      } as Express.Multer.File;

      req.file = mockFile;

      const error = new Error("Upload failed");

      mockedUploadAttachment.mockRejectedValue(error);

      await uploadAttachmentController(req as AuthenticatedRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // getTaskAttachmentsController
  // ============================================================

  describe("getTaskAttachmentsController", () => {
    it("should return task attachments successfully", async () => {
      const attachments = [
        {
          id: attachmentId,
          fileName: "test.pdf",
          fileUrl: "https://cloudinary.com/test.pdf",
          storageKey: "test-public-id",
          mimeType: "application/pdf",
          fileSize: 1024,
          taskId,
          uploadedById: userId,
        },
      ];

      mockedGetTaskAttachments.mockResolvedValue(attachments as any);

      await getTaskAttachmentsController(req as AuthenticatedRequest, res as Response, next);

      expect(mockedGetTaskAttachments).toHaveBeenCalledWith(taskId, userId);

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: attachments,
      });

      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 when user is not authenticated", async () => {
      req.userId = undefined;

      await getTaskAttachmentsController(req as AuthenticatedRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: "Authentication required",
        },
      });

      expect(mockedGetTaskAttachments).not.toHaveBeenCalled();

      expect(next).not.toHaveBeenCalled();
    });

    it("should call next when getTaskAttachments service throws an error", async () => {
      const error = new Error("Task not found");

      mockedGetTaskAttachments.mockRejectedValue(error);

      await getTaskAttachmentsController(req as AuthenticatedRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // getAttachmentByIdController
  // ============================================================

  describe("getAttachmentByIdController", () => {
    it("should return attachment successfully", async () => {
      const attachment = {
        id: attachmentId,
        taskId,
        fileName: "test.pdf",
        fileUrl: "https://cloudinary.com/test.pdf",
        storageKey: "test-public-id",
        mimeType: "application/pdf",
        fileSize: 1024,
        uploadedById: userId,
      };

      mockedGetAttachmentById.mockResolvedValue(attachment as any);

      await getAttachmentByIdController(req as AuthenticatedRequest, res as Response, next);

      expect(mockedGetAttachmentById).toHaveBeenCalledWith(taskId, attachmentId, userId);

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: attachment,
      });

      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 when user is not authenticated", async () => {
      req.userId = undefined;

      await getAttachmentByIdController(req as AuthenticatedRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: "Authentication required",
        },
      });

      expect(mockedGetAttachmentById).not.toHaveBeenCalled();

      expect(next).not.toHaveBeenCalled();
    });

    it("should call next when getAttachmentById service throws an error", async () => {
      const error = new Error("Attachment not found");

      mockedGetAttachmentById.mockRejectedValue(error);

      await getAttachmentByIdController(req as AuthenticatedRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // deleteAttachmentController
  // ============================================================

  describe("deleteAttachmentController", () => {
    it("should delete attachment successfully", async () => {
      mockedDeleteAttachment.mockResolvedValue(undefined);

      await deleteAttachmentController(req as AuthenticatedRequest, res as Response, next);

      expect(mockedDeleteAttachment).toHaveBeenCalledWith(taskId, attachmentId, userId);

      expect(res.status).toHaveBeenCalledWith(204);

      expect(res.send).toHaveBeenCalled();

      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 when user is not authenticated", async () => {
      req.userId = undefined;

      await deleteAttachmentController(req as AuthenticatedRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: "Authentication required",
        },
      });

      expect(mockedDeleteAttachment).not.toHaveBeenCalled();

      expect(next).not.toHaveBeenCalled();
    });

    it("should call next when deleteAttachment service throws an error", async () => {
      const error = new Error("Attachment not found");

      mockedDeleteAttachment.mockRejectedValue(error);

      await deleteAttachmentController(req as AuthenticatedRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.send).not.toHaveBeenCalled();
    });
  });
});
