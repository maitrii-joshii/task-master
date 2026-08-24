import prisma from "../../config/prisma";
import { hashPassword } from "../../utils/password";
import { AppError } from "../../utils/appError";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export const registerUser = async ({ name, email, password }: RegisterInput) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    throw new AppError("User with this email already exists", 409);
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
    },
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
};
