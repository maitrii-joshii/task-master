import prisma from "../../../config/prisma";
import { createInvitationSchema } from "./invitation.schema";
import { AppError } from "../../../utils/appError";

export const createInvitation = async (projectId: string, invitedById: string, input: unknown) => {
  const { invitedUserId } = createInvitationSchema.parse(input);

  // 1. Check project exists
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
  });

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  // 2. Only project owner can invite users
  if (project.ownerId !== invitedById) {
    throw new AppError("Only the project owner can invite users", 403);
  }

  // 3. Check invited user exists
  const invitedUser = await prisma.user.findUnique({
    where: {
      id: invitedUserId,
    },
  });

  if (!invitedUser) {
    throw new AppError("User to invite not found", 404);
  }

  // 4. Prevent owner from inviting themselves
  if (invitedUserId === invitedById) {
    throw new AppError("You cannot invite yourself", 400);
  }

  // 5. Check whether user is already a member
  const existingMember = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId: invitedUserId,
      },
    },
  });

  if (existingMember) {
    throw new AppError("User is already a project member", 409);
  }

  // 6. Check whether invitation already exists
  const existingInvitation = await prisma.projectInvitation.findUnique({
    where: {
      projectId_invitedUserId: {
        projectId,
        invitedUserId,
      },
    },
  });

  if (existingInvitation) {
    throw new AppError("Invitation already exists", 409);
  }

  // 7. Create invitation
  const invitation = await prisma.projectInvitation.create({
    data: {
      projectId,
      invitedUserId,
      invitedById,
    },
  });

  return invitation;
};

export const acceptInvitation = async (invitationId: string, userId: string) => {
  const invitation = await prisma.projectInvitation.findUnique({
    where: {
      id: invitationId,
    },
  });

  // 1. Check if invitation exists
  if (!invitation) {
    throw new AppError("Invitation not found", 404);
  }

  // 2. Check if the user accepting the invitation is the invited user
  if (invitation.invitedUserId !== userId) {
    throw new AppError("You are not allowed to accept this invitation", 403);
  }

  // 3. Check if the invitation is still pending
  if (invitation.status !== "PENDING") {
    throw new AppError("Invitation is no longer pending", 409);
  }

  // 4. Accept the invitation and add the user as a project member in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const member = await tx.projectMember.create({
      data: {
        projectId: invitation.projectId,
        userId,
        role: "MEMBER",
      },
    });

    // 5. Update the invitation status to "ACCEPTED"
    const updatedInvitation = await tx.projectInvitation.update({
      where: {
        id: invitationId,
      },
      data: {
        status: "ACCEPTED",
      },
    });

    return {
      member,
      invitation: updatedInvitation,
    };
  });

  return result;
};

export const rejectInvitation = async (invitationId: string, userId: string) => {
  const invitation = await prisma.projectInvitation.findUnique({
    where: {
      id: invitationId,
    },
  });

  // 1. Check if invitation exists
  if (!invitation) {
    throw new AppError("Invitation not found", 404);
  }

  // 2. Check if the user rejecting the invitation is the invited user
  if (invitation.invitedUserId !== userId) {
    throw new AppError("You are not allowed to reject this invitation", 403);
  }

  // 3. Check if the invitation is still pending
  if (invitation.status !== "PENDING") {
    throw new AppError("Invitation is no longer pending", 409);
  }

  const updatedInvitation = await prisma.projectInvitation.update({
    where: {
      id: invitationId,
    },
    data: {
      status: "REJECTED",
    },
  });

  return updatedInvitation;
};
