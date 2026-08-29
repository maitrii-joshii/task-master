import prisma from "../../../config/prisma";
import { AppError } from "../../../utils/appError";

export const createComment = async (taskId: string, authorId: string, content: string) => {
  const task = await prisma.task.findUnique({
    where: {
      id: taskId,
    },
    include: {
      project: {
        include: {
          members: {
            where: {
              userId: authorId,
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
    task.creatorId === authorId ||
    task.assigneeId === authorId ||
    (task.project !== null && task.project.members.length > 0);

  if (!hasAccess) {
    throw new AppError("User is not authorized to comment on this task", 403);
  }

  const comment = await prisma.comment.create({
    data: {
      content,
      taskId,
      authorId,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });

  return comment;
};

export const getTaskComments = async (taskId: string, userId: string) => {
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
    throw new AppError("User is not authorized to view comments", 403);
  }

  const comments = await prisma.comment.findMany({
    where: {
      taskId,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return comments;
};

export const getCommentById = async (taskId: string, commentId: string, userId: string) => {
  const comment = await prisma.comment.findFirst({
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
          avatarUrl: true,
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

  if (!comment) {
    throw new AppError("Comment not found", 404);
  }

  const hasAccess =
    comment.task.creatorId === userId ||
    comment.task.assigneeId === userId ||
    (comment.task.project?.members.length ?? 0) > 0;

  if (!hasAccess) {
    throw new AppError("User is not authorized to view this comment", 403);
  }

  return comment;
};

export const updateComment = async (
  taskId: string,
  commentId: string,
  authorId: string,
  content: string
) => {
  const comment = await prisma.comment.findFirst({
    where: {
      id: commentId,
      taskId,
    },
  });

  if (!comment) {
    throw new AppError("Comment not found", 404);
  }

  if (comment.authorId !== authorId) {
    throw new AppError("You can only update your own comments", 403);
  }

  const updatedComment = await prisma.comment.update({
    where: {
      id: commentId,
    },
    data: {
      content,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });

  return updatedComment;
};

export const deleteComment = async (taskId: string, commentId: string, authorId: string) => {
  const comment = await prisma.comment.findFirst({
    where: {
      id: commentId,
      taskId,
    },
  });

  if (!comment) {
    throw new AppError("Comment not found", 404);
  }

  if (comment.authorId !== authorId) {
    throw new AppError("You can only delete your own comments", 403);
  }

  await prisma.comment.delete({
    where: {
      id: commentId,
    },
  });
};
