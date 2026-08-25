import prisma from "../../config/prisma";
import { AppError } from "../../utils/appError";

export const getCurrentUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
};

interface UpdateProfileInput {
  name?: string;
}

export const updateCurrentUser = async (userId: string, data: UpdateProfileInput) => {
  const user = await prisma.user.update({
    where: {
      id: userId,
    },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
};
