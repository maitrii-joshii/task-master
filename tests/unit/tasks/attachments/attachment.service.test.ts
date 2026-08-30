import type { Express } from "express";
import { Buffer } from "node:buffer";

import {
  uploadAttachment,
  getTaskAttachments,
  getAttachmentById,
  deleteAttachment,
} from "../../../../src/modules/tasks/attachments/attachment.service";

import prisma from "../../../../src/config/prisma";
import { uploadToCloudinary } from "../../../../src/modules/tasks/attachments/cloudinary/cloudinary.service";

jest.mock("../../../../src/config/prisma", () => ({
  __esModule: true,
  default: {
    task: {
      findUnique: jest.fn(),
    },
    attachment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock("../../../../src/modules/tasks/attachments/cloudinary/cloudinary.service", () => ({
  uploadToCloudinary: jest.fn(),
}));

const mockedPrisma = prisma as unknown as {
  task: {
    findUnique: jest.Mock;
  };
  attachment: {
    create: jest.Mock;
    findMany: jest.Mock;
    findFirst: jest.Mock;
    delete: jest.Mock;
  };
};

const mockedUploadToCloudinary = uploadToCloudinary as jest.MockedFunction<
  typeof uploadToCloudinary
>;

describe("Attachment Service", () => {
  const userId = "user-123";
  const taskId = "task-123";
  const attachmentId = "attachment-123";

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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // uploadAttachment
  // ============================================================

  describe("uploadAttachment", () => {
    it("should upload file and create attachment successfully", async () => {
      mockedPrisma.task.findUnique.mockResolvedValue({
        id: taskId,
        title: "Test task",
        description: null,
        dueDate: null,
        status: "OPEN",
        projectId: null,
        creatorId: userId,
        assigneeId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        project: null,
      } as any);

      mockedUploadToCloudinary.mockResolvedValue({
        secure_url: "https://cloudinary.com/test.pdf",
        public_id: "task-master/attachments/test",
      } as any);

      const createdAttachment = {
        id: attachmentId,
        fileName: "test.pdf",
        fileUrl: "https://cloudinary.com/test.pdf",
        storageKey: "task-master/attachments/test",
        mimeType: "application/pdf",
        fileSize: 1024,
        taskId,
        uploadedById: userId,
        createdAt: new Date(),
      };

      mockedPrisma.attachment.create.mockResolvedValue(createdAttachment as any);

      const result = await uploadAttachment(taskId, userId, mockFile);

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

      expect(mockedUploadToCloudinary).toHaveBeenCalledWith(mockFile);

      expect(mockedPrisma.attachment.create).toHaveBeenCalledWith({
        data: {
          fileName: "test.pdf",
          fileUrl: "https://cloudinary.com/test.pdf",
          storageKey: "task-master/attachments/test",
          mimeType: "application/pdf",
          fileSize: 1024,
          taskId,
          uploadedById: userId,
        },
      });

      expect(result).toEqual(createdAttachment);
    });

    it("should throw 404 when task does not exist", async () => {
      mockedPrisma.task.findUnique.mockResolvedValue(null);

      await expect(uploadAttachment(taskId, userId, mockFile)).rejects.toMatchObject({
        message: "Task not found",
        statusCode: 404,
      });

      expect(mockedUploadToCloudinary).not.toHaveBeenCalled();
      expect(mockedPrisma.attachment.create).not.toHaveBeenCalled();
    });

    it("should allow the task creator to upload an attachment", async () => {
      mockedPrisma.task.findUnique.mockResolvedValue({
        id: taskId,
        creatorId: userId,
        assigneeId: "another-user",
        project: null,
      } as any);

      mockedUploadToCloudinary.mockResolvedValue({
        secure_url: "https://cloudinary.com/test.pdf",
        public_id: "test-public-id",
      } as any);

      mockedPrisma.attachment.create.mockResolvedValue({
        id: attachmentId,
      } as any);

      await uploadAttachment(taskId, userId, mockFile);

      expect(mockedUploadToCloudinary).toHaveBeenCalled();
      expect(mockedPrisma.attachment.create).toHaveBeenCalled();
    });

    it("should allow the task assignee to upload an attachment", async () => {
      mockedPrisma.task.findUnique.mockResolvedValue({
        id: taskId,
        creatorId: "creator-id",
        assigneeId: userId,
        project: null,
      } as any);

      mockedUploadToCloudinary.mockResolvedValue({
        secure_url: "https://cloudinary.com/test.pdf",
        public_id: "test-public-id",
      } as any);

      mockedPrisma.attachment.create.mockResolvedValue({
        id: attachmentId,
      } as any);

      await uploadAttachment(taskId, userId, mockFile);

      expect(mockedUploadToCloudinary).toHaveBeenCalled();
    });

    it("should allow a project member to upload an attachment", async () => {
      mockedPrisma.task.findUnique.mockResolvedValue({
        id: taskId,
        creatorId: "creator-id",
        assigneeId: "another-user",
        project: {
          members: [
            {
              id: "member-123",
            },
          ],
        },
      } as any);

      mockedUploadToCloudinary.mockResolvedValue({
        secure_url: "https://cloudinary.com/test.pdf",
        public_id: "test-public-id",
      } as any);

      mockedPrisma.attachment.create.mockResolvedValue({
        id: attachmentId,
      } as any);

      await uploadAttachment(taskId, userId, mockFile);

      expect(mockedUploadToCloudinary).toHaveBeenCalled();
    });

    it("should throw 403 when user has no access to the task", async () => {
      mockedPrisma.task.findUnique.mockResolvedValue({
        id: taskId,
        creatorId: "creator-id",
        assigneeId: "assignee-id",
        project: {
          members: [],
        },
      } as any);

      await expect(uploadAttachment(taskId, userId, mockFile)).rejects.toMatchObject({
        message: "User is not authorized to upload attachments to this task",
        statusCode: 403,
      });

      expect(mockedUploadToCloudinary).not.toHaveBeenCalled();
      expect(mockedPrisma.attachment.create).not.toHaveBeenCalled();
    });

    it("should throw 400 when file is missing", async () => {
      mockedPrisma.task.findUnique.mockResolvedValue({
        id: taskId,
        creatorId: userId,
        assigneeId: null,
        project: null,
      } as any);

      await expect(uploadAttachment(taskId, userId, undefined as any)).rejects.toMatchObject({
        message: "File is required",
        statusCode: 400,
      });

      expect(mockedUploadToCloudinary).not.toHaveBeenCalled();
    });

    it("should propagate Cloudinary upload errors", async () => {
      mockedPrisma.task.findUnique.mockResolvedValue({
        id: taskId,
        creatorId: userId,
        assigneeId: null,
        project: null,
      } as any);

      const cloudinaryError = new Error("Cloudinary upload failed");

      mockedUploadToCloudinary.mockRejectedValue(cloudinaryError);

      await expect(uploadAttachment(taskId, userId, mockFile)).rejects.toThrow(
        "Cloudinary upload failed"
      );

      expect(mockedPrisma.attachment.create).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // getTaskAttachments
  // ============================================================

  describe("getTaskAttachments", () => {
    it("should return all attachments for an authorized user", async () => {
      mockedPrisma.task.findUnique.mockResolvedValue({
        id: taskId,
        creatorId: userId,
        assigneeId: null,
        project: null,
      } as any);

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

      mockedPrisma.attachment.findMany.mockResolvedValue(attachments as any);

      const result = await getTaskAttachments(taskId, userId);

      expect(mockedPrisma.attachment.findMany).toHaveBeenCalledWith({
        where: {
          taskId,
        },
        include: {
          uploadedBy: {
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

      expect(result).toEqual(attachments);
    });

    it("should throw 404 when task does not exist", async () => {
      mockedPrisma.task.findUnique.mockResolvedValue(null);

      await expect(getTaskAttachments(taskId, userId)).rejects.toMatchObject({
        message: "Task not found",
        statusCode: 404,
      });

      expect(mockedPrisma.attachment.findMany).not.toHaveBeenCalled();
    });

    it("should throw 403 when user is not authorized", async () => {
      mockedPrisma.task.findUnique.mockResolvedValue({
        id: taskId,
        creatorId: "creator-id",
        assigneeId: "assignee-id",
        project: {
          members: [],
        },
      } as any);

      await expect(getTaskAttachments(taskId, userId)).rejects.toMatchObject({
        message: "User is not authorized to view attachments",
        statusCode: 403,
      });

      expect(mockedPrisma.attachment.findMany).not.toHaveBeenCalled();
    });

    it("should allow a project member to view attachments", async () => {
      mockedPrisma.task.findUnique.mockResolvedValue({
        id: taskId,
        creatorId: "creator-id",
        assigneeId: null,
        project: {
          members: [
            {
              id: "member-123",
            },
          ],
        },
      } as any);

      mockedPrisma.attachment.findMany.mockResolvedValue([]);

      const result = await getTaskAttachments(taskId, userId);

      expect(result).toEqual([]);
      expect(mockedPrisma.attachment.findMany).toHaveBeenCalled();
    });
  });

  // ============================================================
  // getAttachmentById
  // ============================================================

  describe("getAttachmentById", () => {
    it("should return attachment when user is authorized", async () => {
      const attachment = {
        id: attachmentId,
        taskId,
        fileName: "test.pdf",
        fileUrl: "https://cloudinary.com/test.pdf",
        storageKey: "test-public-id",
        mimeType: "application/pdf",
        fileSize: 1024,
        uploadedById: userId,
        uploadedBy: {
          id: userId,
          name: "John",
          email: "john@example.com",
        },
        task: {
          creatorId: userId,
          assigneeId: null,
          project: null,
        },
      };

      mockedPrisma.attachment.findFirst.mockResolvedValue(attachment as any);

      const result = await getAttachmentById(taskId, attachmentId, userId);

      expect(mockedPrisma.attachment.findFirst).toHaveBeenCalledWith({
        where: {
          id: attachmentId,
          taskId,
        },
        include: {
          uploadedBy: {
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

      expect(result).toEqual(attachment);
    });

    it("should throw 404 when attachment does not exist", async () => {
      mockedPrisma.attachment.findFirst.mockResolvedValue(null);

      await expect(getAttachmentById(taskId, attachmentId, userId)).rejects.toMatchObject({
        message: "Attachment not found",
        statusCode: 404,
      });
    });

    it("should throw 403 when user is not authorized", async () => {
      mockedPrisma.attachment.findFirst.mockResolvedValue({
        id: attachmentId,
        taskId,
        uploadedById: "another-user",
        task: {
          creatorId: "creator-id",
          assigneeId: "assignee-id",
          project: {
            members: [],
          },
        },
      } as any);

      await expect(getAttachmentById(taskId, attachmentId, userId)).rejects.toMatchObject({
        message: "User is not authorized to view this attachment",
        statusCode: 403,
      });
    });

    it("should allow the assignee to view the attachment", async () => {
      mockedPrisma.attachment.findFirst.mockResolvedValue({
        id: attachmentId,
        taskId,
        task: {
          creatorId: "creator-id",
          assigneeId: userId,
          project: null,
        },
      } as any);

      const result = await getAttachmentById(taskId, attachmentId, userId);

      expect(result.id).toBe(attachmentId);
    });
  });

  // ============================================================
  // deleteAttachment
  // ============================================================

  describe("deleteAttachment", () => {
    it("should delete an attachment successfully", async () => {
      mockedPrisma.attachment.findFirst.mockResolvedValue({
        id: attachmentId,
        taskId,
        uploadedById: userId,
      } as any);

      mockedPrisma.attachment.delete.mockResolvedValue({
        id: attachmentId,
      } as any);

      await deleteAttachment(taskId, attachmentId, userId);

      expect(mockedPrisma.attachment.findFirst).toHaveBeenCalledWith({
        where: {
          id: attachmentId,
          taskId,
        },
      });

      expect(mockedPrisma.attachment.delete).toHaveBeenCalledWith({
        where: {
          id: attachmentId,
        },
      });
    });

    it("should throw 404 when attachment does not exist", async () => {
      mockedPrisma.attachment.findFirst.mockResolvedValue(null);

      await expect(deleteAttachment(taskId, attachmentId, userId)).rejects.toMatchObject({
        message: "Attachment not found",
        statusCode: 404,
      });

      expect(mockedPrisma.attachment.delete).not.toHaveBeenCalled();
    });

    it("should throw 403 when user is not the uploader", async () => {
      mockedPrisma.attachment.findFirst.mockResolvedValue({
        id: attachmentId,
        taskId,
        uploadedById: "different-user",
      } as any);

      await expect(deleteAttachment(taskId, attachmentId, userId)).rejects.toMatchObject({
        message: "You can only delete your own attachments",
        statusCode: 403,
      });

      expect(mockedPrisma.attachment.delete).not.toHaveBeenCalled();
    });
  });
});
