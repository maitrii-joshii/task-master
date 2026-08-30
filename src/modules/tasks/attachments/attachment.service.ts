import type { Express } from "express";
import prisma from "../../../config/prisma";
import { AppError } from "../../../utils/appError";
import { uploadToCloudinary } from "./cloudinary/cloudinary.service";

export const uploadAttachment = async (
  taskId: string,
  userId: string,
  file: Express.Multer.File
) => {
  const task = await prisma.task.findUnique({
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

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  const hasAccess =
    task.creatorId === userId ||
    task.assigneeId === userId ||
    (task.project !== null && task.project.members.length > 0);

  if (!hasAccess) {
    throw new AppError("User is not authorized to upload attachments to this task", 403);
  }

  if (!file) {
    throw new AppError("File is required", 400);
  }

  const uploadedFile = await uploadToCloudinary(file);

  const attachment = await prisma.attachment.create({
    data: {
      fileName: file.originalname,
      fileUrl: uploadedFile.secure_url,
      storageKey: uploadedFile.public_id,
      mimeType: file.mimetype,
      fileSize: file.size,
      taskId,
      uploadedById: userId,
    },
  });

  return attachment;
};

export const getTaskAttachments = async (taskId: string, userId: string) => {
  const task = await prisma.task.findUnique({
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

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  const hasAccess =
    task.creatorId === userId ||
    task.assigneeId === userId ||
    (task.project !== null && task.project.members.length > 0);

  if (!hasAccess) {
    throw new AppError("User is not authorized to view attachments", 403);
  }

  return prisma.attachment.findMany({
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
};

export const getAttachmentById = async (taskId: string, attachmentId: string, userId: string) => {
  const attachment = await prisma.attachment.findFirst({
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

  if (!attachment) {
    throw new AppError("Attachment not found", 404);
  }

  const hasAccess =
    attachment.task.creatorId === userId ||
    attachment.task.assigneeId === userId ||
    (attachment.task.project?.members.length ?? 0) > 0;

  if (!hasAccess) {
    throw new AppError("User is not authorized to view this attachment", 403);
  }

  return attachment;
};

export const deleteAttachment = async (taskId: string, attachmentId: string, userId: string) => {
  const attachment = await prisma.attachment.findFirst({
    where: {
      id: attachmentId,
      taskId,
    },
  });

  if (!attachment) {
    throw new AppError("Attachment not found", 404);
  }

  if (attachment.uploadedById !== userId) {
    throw new AppError("You can only delete your own attachments", 403);
  }

  await prisma.attachment.delete({
    where: {
      id: attachmentId,
    },
  });
};
