import prisma, { pool } from "../../src/config/prisma";

export const cleanDatabase = async (): Promise<void> => {
  await prisma.projectInvitation.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.task.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
};

export const disconnectDatabase = async (): Promise<void> => {
  await prisma.$disconnect();
  await pool.end();
};
