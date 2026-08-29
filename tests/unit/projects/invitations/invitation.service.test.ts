import prisma from "../../../../src/config/prisma";
import {
  createInvitation,
  acceptInvitation,
  rejectInvitation,
} from "../../../../src/modules/projects/invitations/invitation.service";
import { AppError } from "../../../../src/utils/appError";

jest.mock("../../../../src/config/prisma", () => ({
  __esModule: true,
  default: {
    project: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    projectMember: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    projectInvitation: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

const projectId = "550e8400-e29b-41d4-a716-446655440000";
const invitedById = "550e8400-e29b-41d4-a716-446655440001";
const invitedUserId = "550e8400-e29b-41d4-a716-446655440002";
const invitationId = "550e8400-e29b-41d4-a716-446655440003";

const input = {
  invitedUserId,
};

describe("Invitation Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createInvitation", () => {
    it("should create an invitation when all conditions are valid", async () => {
      const project = {
        id: projectId,
        ownerId: invitedById,
      };

      const invitedUser = {
        id: invitedUserId,
      };

      const invitation = {
        id: invitationId,
        projectId,
        invitedUserId,
        invitedById,
        status: "PENDING",
      };

      (prisma.project.findUnique as jest.Mock).mockResolvedValue(project);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(invitedUser);
      (prisma.projectMember.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.projectInvitation.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.projectInvitation.create as jest.Mock).mockResolvedValue(invitation);

      const result = await createInvitation(projectId, invitedById, input);

      expect(result).toEqual(invitation);

      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: {
          id: projectId,
        },
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: invitedUserId,
        },
      });

      expect(prisma.projectMember.findUnique).toHaveBeenCalledWith({
        where: {
          projectId_userId: {
            projectId,
            userId: invitedUserId,
          },
        },
      });

      expect(prisma.projectInvitation.findUnique).toHaveBeenCalledWith({
        where: {
          projectId_invitedUserId: {
            projectId,
            invitedUserId,
          },
        },
      });

      expect(prisma.projectInvitation.create).toHaveBeenCalledWith({
        data: {
          projectId,
          invitedUserId,
          invitedById,
        },
      });
    });

    it("should throw 404 when project does not exist", async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(createInvitation(projectId, invitedById, input)).rejects.toEqual(
        new AppError("Project not found", 404)
      );

      expect(prisma.user.findUnique).not.toHaveBeenCalled();
      expect(prisma.projectInvitation.create).not.toHaveBeenCalled();
    });

    it("should throw 403 when inviter is not the project owner", async () => {
      const project = {
        id: projectId,
        ownerId: "550e8400-e29b-41d4-a716-446655440009",
      };

      (prisma.project.findUnique as jest.Mock).mockResolvedValue(project);

      await expect(createInvitation(projectId, invitedById, input)).rejects.toEqual(
        new AppError("Only the project owner can invite users", 403)
      );

      expect(prisma.user.findUnique).not.toHaveBeenCalled();
      expect(prisma.projectInvitation.create).not.toHaveBeenCalled();
    });

    it("should throw 404 when invited user does not exist", async () => {
      const project = {
        id: projectId,
        ownerId: invitedById,
      };

      (prisma.project.findUnique as jest.Mock).mockResolvedValue(project);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(createInvitation(projectId, invitedById, input)).rejects.toEqual(
        new AppError("User to invite not found", 404)
      );

      expect(prisma.projectMember.findUnique).not.toHaveBeenCalled();
      expect(prisma.projectInvitation.create).not.toHaveBeenCalled();
    });

    it("should throw 400 when owner tries to invite themselves", async () => {
      const project = {
        id: projectId,
        ownerId: invitedById,
      };

      const selfInviteInput = {
        invitedUserId: invitedById,
      };

      const invitedUser = {
        id: invitedById,
      };

      (prisma.project.findUnique as jest.Mock).mockResolvedValue(project);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(invitedUser);

      await expect(createInvitation(projectId, invitedById, selfInviteInput)).rejects.toEqual(
        new AppError("You cannot invite yourself", 400)
      );

      expect(prisma.projectMember.findUnique).not.toHaveBeenCalled();
      expect(prisma.projectInvitation.create).not.toHaveBeenCalled();
    });

    it("should throw 409 when invited user is already a project member", async () => {
      const project = {
        id: projectId,
        ownerId: invitedById,
      };

      const invitedUser = {
        id: invitedUserId,
      };

      const existingMember = {
        projectId,
        userId: invitedUserId,
        role: "MEMBER",
      };

      (prisma.project.findUnique as jest.Mock).mockResolvedValue(project);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(invitedUser);
      (prisma.projectMember.findUnique as jest.Mock).mockResolvedValue(existingMember);

      await expect(createInvitation(projectId, invitedById, input)).rejects.toEqual(
        new AppError("User is already a project member", 409)
      );

      expect(prisma.projectInvitation.findUnique).not.toHaveBeenCalled();
      expect(prisma.projectInvitation.create).not.toHaveBeenCalled();
    });

    it("should throw 409 when an invitation already exists", async () => {
      const project = {
        id: projectId,
        ownerId: invitedById,
      };

      const invitedUser = {
        id: invitedUserId,
      };

      const existingInvitation = {
        id: invitationId,
        projectId,
        invitedUserId,
        invitedById,
        status: "PENDING",
      };

      (prisma.project.findUnique as jest.Mock).mockResolvedValue(project);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(invitedUser);
      (prisma.projectMember.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.projectInvitation.findUnique as jest.Mock).mockResolvedValue(existingInvitation);

      await expect(createInvitation(projectId, invitedById, input)).rejects.toEqual(
        new AppError("Invitation already exists", 409)
      );

      expect(prisma.projectInvitation.create).not.toHaveBeenCalled();
    });
  });

  describe("acceptInvitation", () => {
    const invitation = {
      id: invitationId,
      projectId,
      invitedUserId,
      invitedById,
      status: "PENDING",
    };

    it("should accept an invitation and create a project member", async () => {
      const member = {
        projectId,
        userId: invitedUserId,
        role: "MEMBER",
      };

      const updatedInvitation = {
        ...invitation,
        status: "ACCEPTED",
      };

      (prisma.projectInvitation.findUnique as jest.Mock).mockResolvedValue(invitation);

      const tx = {
        projectMember: {
          create: jest.fn().mockResolvedValue(member),
        },
        projectInvitation: {
          update: jest.fn().mockResolvedValue(updatedInvitation),
        },
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback(tx);
      });

      const result = await acceptInvitation(invitationId, invitedUserId);

      expect(result).toEqual({
        member,
        invitation: updatedInvitation,
      });

      expect(prisma.projectInvitation.findUnique).toHaveBeenCalledWith({
        where: {
          id: invitationId,
        },
      });

      expect(tx.projectMember.create).toHaveBeenCalledWith({
        data: {
          projectId,
          userId: invitedUserId,
          role: "MEMBER",
        },
      });

      expect(tx.projectInvitation.update).toHaveBeenCalledWith({
        where: {
          id: invitationId,
        },
        data: {
          status: "ACCEPTED",
        },
      });
    });

    it("should throw 404 when invitation does not exist", async () => {
      (prisma.projectInvitation.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(acceptInvitation(invitationId, invitedUserId)).rejects.toEqual(
        new AppError("Invitation not found", 404)
      );

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("should throw 403 when another user tries to accept the invitation", async () => {
      const invitation = {
        id: invitationId,
        projectId,
        invitedUserId,
        invitedById,
        status: "PENDING",
      };

      const anotherUserId = "550e8400-e29b-41d4-a716-446655440004";

      (prisma.projectInvitation.findUnique as jest.Mock).mockResolvedValue(invitation);

      await expect(acceptInvitation(invitationId, anotherUserId)).rejects.toEqual(
        new AppError("You are not allowed to accept this invitation", 403)
      );

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("should throw 409 when invitation is no longer pending", async () => {
      const invitation = {
        id: invitationId,
        projectId,
        invitedUserId,
        invitedById,
        status: "ACCEPTED",
      };

      (prisma.projectInvitation.findUnique as jest.Mock).mockResolvedValue(invitation);

      await expect(acceptInvitation(invitationId, invitedUserId)).rejects.toEqual(
        new AppError("Invitation is no longer pending", 409)
      );

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe("rejectInvitation", () => {
    const invitation = {
      id: invitationId,
      projectId,
      invitedUserId,
      invitedById,
      status: "PENDING",
    };

    it("should reject an invitation", async () => {
      const updatedInvitation = {
        ...invitation,
        status: "REJECTED",
      };

      (prisma.projectInvitation.findUnique as jest.Mock).mockResolvedValue(invitation);

      (prisma.projectInvitation.update as jest.Mock).mockResolvedValue(updatedInvitation);

      const result = await rejectInvitation(invitationId, invitedUserId);

      expect(result).toEqual(updatedInvitation);

      expect(prisma.projectInvitation.update).toHaveBeenCalledWith({
        where: {
          id: invitationId,
        },
        data: {
          status: "REJECTED",
        },
      });
    });

    it("should throw 404 when invitation does not exist", async () => {
      (prisma.projectInvitation.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(rejectInvitation(invitationId, invitedUserId)).rejects.toEqual(
        new AppError("Invitation not found", 404)
      );

      expect(prisma.projectInvitation.update).not.toHaveBeenCalled();
    });

    it("should throw 403 when another user tries to reject the invitation", async () => {
      const anotherUserId = "550e8400-e29b-41d4-a716-446655440004";

      (prisma.projectInvitation.findUnique as jest.Mock).mockResolvedValue(invitation);

      await expect(rejectInvitation(invitationId, anotherUserId)).rejects.toEqual(
        new AppError("You are not allowed to reject this invitation", 403)
      );

      expect(prisma.projectInvitation.update).not.toHaveBeenCalled();
    });

    it("should throw 409 when invitation is no longer pending", async () => {
      const acceptedInvitation = {
        ...invitation,
        status: "ACCEPTED",
      };

      (prisma.projectInvitation.findUnique as jest.Mock).mockResolvedValue(acceptedInvitation);

      await expect(rejectInvitation(invitationId, invitedUserId)).rejects.toEqual(
        new AppError("Invitation is no longer pending", 409)
      );

      expect(prisma.projectInvitation.update).not.toHaveBeenCalled();
    });
  });
});
