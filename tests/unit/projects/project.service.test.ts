import prisma from "../../../src/config/prisma";

import {
  createProject,
  updateProject,
  getProjectById,
  getProjects,
  deleteProject,
  getProjectMembers,
  removeProjectMember,
} from "../../../src/modules/projects/project.service";

import { AppError } from "../../../src/utils/appError";

jest.mock("../../../src/config/prisma", () => ({
  __esModule: true,
  default: {
    $transaction: jest.fn(),
    project: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    projectMember: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe("Project Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------
  // createProject
  // --------------------------------------------------

  describe("createProject", () => {
    it("should create a project and add the user as owner", async () => {
      const userId = "user-123";

      const input = {
        name: "TaskMaster Project",
        description: "Project description",
      };

      const mockProject = {
        id: "project-123",
        name: input.name,
        description: input.description,
        ownerId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const tx = {
        project: {
          create: jest.fn().mockResolvedValue(mockProject),
        },
        projectMember: {
          create: jest.fn().mockResolvedValue({
            projectId: mockProject.id,
            userId,
            role: "OWNER",
          }),
        },
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback(tx);
      });

      const result = await createProject(userId, input);

      expect(tx.project.create).toHaveBeenCalledWith({
        data: {
          name: input.name,
          description: input.description,
          ownerId: userId,
        },
      });

      expect(tx.projectMember.create).toHaveBeenCalledWith({
        data: {
          projectId: mockProject.id,
          userId,
          role: "OWNER",
        },
      });

      expect(result).toEqual(mockProject);
    });

    it("should create a project without a description", async () => {
      const userId = "user-123";

      const input = {
        name: "TaskMaster Project",
      };

      const mockProject = {
        id: "project-123",
        name: input.name,
        description: undefined,
        ownerId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const tx = {
        project: {
          create: jest.fn().mockResolvedValue(mockProject),
        },
        projectMember: {
          create: jest.fn().mockResolvedValue({
            projectId: mockProject.id,
            userId,
            role: "OWNER",
          }),
        },
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback(tx);
      });

      const result = await createProject(userId, input);

      expect(tx.project.create).toHaveBeenCalledWith({
        data: {
          name: input.name,
          description: undefined,
          ownerId: userId,
        },
      });

      expect(tx.projectMember.create).toHaveBeenCalledWith({
        data: {
          projectId: mockProject.id,
          userId,
          role: "OWNER",
        },
      });

      expect(result).toEqual(mockProject);
    });

    it("should reject invalid project input", async () => {
      const userId = "user-123";

      const input = {
        name: "ab",
      };

      await expect(createProject(userId, input)).rejects.toThrow();

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------
  // updateProject
  // --------------------------------------------------

  describe("updateProject", () => {
    it("should update the project when the user is the owner", async () => {
      const projectId = "project-123";
      const userId = "user-123";

      const input = {
        name: "Updated Project",
        description: "Updated description",
      };

      const existingProject = {
        id: projectId,
        name: "Old Project",
        description: "Old description",
        ownerId: userId,
      };

      const updatedProject = {
        ...existingProject,
        ...input,
      };

      (prisma.project.findUnique as jest.Mock).mockResolvedValue(existingProject);

      (prisma.project.update as jest.Mock).mockResolvedValue(updatedProject);

      const result = await updateProject(projectId, userId, input);

      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: {
          id: projectId,
        },
      });

      expect(prisma.project.update).toHaveBeenCalledWith({
        where: {
          id: projectId,
        },
        data: input,
      });

      expect(result).toEqual(updatedProject);
    });

    it("should allow clearing the project description with null", async () => {
      const projectId = "project-123";
      const userId = "user-123";

      const input = {
        description: null,
      };

      const existingProject = {
        id: projectId,
        name: "Project",
        description: "Existing description",
        ownerId: userId,
      };

      const updatedProject = {
        ...existingProject,
        description: null,
      };

      (prisma.project.findUnique as jest.Mock).mockResolvedValue(existingProject);

      (prisma.project.update as jest.Mock).mockResolvedValue(updatedProject);

      const result = await updateProject(projectId, userId, input);

      expect(prisma.project.update).toHaveBeenCalledWith({
        where: {
          id: projectId,
        },
        data: input,
      });

      expect(result).toEqual(updatedProject);
    });

    it("should throw 404 when project does not exist", async () => {
      const projectId = "project-123";
      const userId = "user-123";

      (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        updateProject(projectId, userId, {
          name: "Updated Project",
        })
      ).rejects.toEqual(new AppError("Project not found", 404));

      expect(prisma.project.update).not.toHaveBeenCalled();
    });

    it("should throw 403 when user is not the project owner", async () => {
      const projectId = "project-123";
      const userId = "user-123";

      const existingProject = {
        id: projectId,
        name: "Project",
        description: "Description",
        ownerId: "different-user",
      };

      (prisma.project.findUnique as jest.Mock).mockResolvedValue(existingProject);

      await expect(
        updateProject(projectId, userId, {
          name: "Updated Project",
        })
      ).rejects.toEqual(new AppError("You are not authorized to update this project", 403));

      expect(prisma.project.update).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------
  // getProjectById
  // --------------------------------------------------

  describe("getProjectById", () => {
    it("should return the project when the user is a member", async () => {
      const projectId = "project-123";
      const userId = "user-123";

      const project = {
        id: projectId,
        name: "Project",
        description: "Description",
        ownerId: "owner-123",
        members: [
          {
            projectId,
            userId,
            role: "MEMBER",
          },
        ],
      };

      (prisma.project.findUnique as jest.Mock).mockResolvedValue(project);

      const result = await getProjectById(projectId, userId);

      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: {
          id: projectId,
        },
        include: {
          members: true,
        },
      });

      expect(result).toEqual(project);
    });

    it("should return the project when the user is the owner", async () => {
      const projectId = "project-123";
      const userId = "owner-123";

      const project = {
        id: projectId,
        name: "Project",
        description: "Description",
        ownerId: userId,
        members: [],
      };

      (prisma.project.findUnique as jest.Mock).mockResolvedValue(project);

      const result = await getProjectById(projectId, userId);

      expect(result).toEqual(project);
    });

    it("should throw 404 when project does not exist", async () => {
      const projectId = "project-123";
      const userId = "user-123";

      (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(getProjectById(projectId, userId)).rejects.toEqual(
        new AppError("Project not found", 404)
      );
    });

    it("should throw 403 when user is neither owner nor member", async () => {
      const projectId = "project-123";
      const userId = "user-123";

      const project = {
        id: projectId,
        name: "Project",
        description: "Description",
        ownerId: "owner-123",
        members: [
          {
            projectId,
            userId: "different-user",
            role: "MEMBER",
          },
        ],
      };

      (prisma.project.findUnique as jest.Mock).mockResolvedValue(project);

      await expect(getProjectById(projectId, userId)).rejects.toEqual(
        new AppError("You are not authorized to view this project", 403)
      );
    });
  });

  // --------------------------------------------------
  // getProjects
  // --------------------------------------------------

  describe("getProjects", () => {
    it("should return projects owned by or associated with the user", async () => {
      const userId = "user-123";

      const projects = [
        {
          id: "project-1",
          name: "Project One",
          ownerId: userId,
        },
        {
          id: "project-2",
          name: "Project Two",
          ownerId: "owner-123",
        },
      ];

      (prisma.project.findMany as jest.Mock).mockResolvedValue(projects);

      const result = await getProjects(userId);

      expect(prisma.project.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            {
              ownerId: userId,
            },
            {
              members: {
                some: {
                  userId,
                },
              },
            },
          ],
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      expect(result).toEqual(projects);
    });

    it("should return an empty array when the user has no projects", async () => {
      const userId = "user-123";

      (prisma.project.findMany as jest.Mock).mockResolvedValue([]);

      const result = await getProjects(userId);

      expect(result).toEqual([]);
    });
  });

  // --------------------------------------------------
  // deleteProject
  // --------------------------------------------------

  describe("deleteProject", () => {
    it("should delete the project when the user is the owner", async () => {
      const projectId = "project-123";
      const userId = "user-123";

      const project = {
        id: projectId,
        name: "Project",
        ownerId: userId,
      };

      (prisma.project.findUnique as jest.Mock).mockResolvedValue(project);

      (prisma.project.delete as jest.Mock).mockResolvedValue(project);

      const result = await deleteProject(projectId, userId);

      expect(prisma.project.delete).toHaveBeenCalledWith({
        where: {
          id: projectId,
        },
      });

      expect(result).toBeUndefined();
    });

    it("should throw 404 when project does not exist", async () => {
      const projectId = "project-123";
      const userId = "user-123";

      (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(deleteProject(projectId, userId)).rejects.toEqual(
        new AppError("Project not found", 404)
      );

      expect(prisma.project.delete).not.toHaveBeenCalled();
    });

    it("should throw 403 when user is not the project owner", async () => {
      const projectId = "project-123";
      const userId = "user-123";

      const project = {
        id: projectId,
        name: "Project",
        ownerId: "different-user",
      };

      (prisma.project.findUnique as jest.Mock).mockResolvedValue(project);

      await expect(deleteProject(projectId, userId)).rejects.toEqual(
        new AppError("You are not authorized to delete this project", 403)
      );

      expect(prisma.project.delete).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------
  // getProjectMembers
  // --------------------------------------------------

  describe("getProjectMembers", () => {
    it("should return project members when the user is a member", async () => {
      const projectId = "project-123";
      const userId = "user-123";

      const project = {
        id: projectId,
        ownerId: userId,
      };

      const members = [
        {
          projectId,
          userId,
          role: "OWNER",
          createdAt: new Date(),
          user: {
            id: userId,
            name: "John Doe",
            email: "john@example.com",
            createdAt: new Date(),
          },
        },
      ];

      (prisma.project.findUnique as jest.Mock).mockResolvedValue(project);

      (prisma.projectMember.findUnique as jest.Mock).mockResolvedValue({
        projectId,
        userId,
        role: "OWNER",
      });

      (prisma.projectMember.findMany as jest.Mock).mockResolvedValue(members);

      const result = await getProjectMembers(projectId, userId);

      expect(prisma.projectMember.findUnique).toHaveBeenCalledWith({
        where: {
          projectId_userId: {
            projectId,
            userId,
          },
        },
      });

      expect(prisma.projectMember.findMany).toHaveBeenCalledWith({
        where: {
          projectId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      expect(result).toEqual(members);
    });

    it("should throw 404 when project does not exist", async () => {
      const projectId = "project-123";
      const userId = "user-123";

      (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(getProjectMembers(projectId, userId)).rejects.toEqual(
        new AppError("Project not found", 404)
      );

      expect(prisma.projectMember.findUnique).not.toHaveBeenCalled();
    });

    it("should throw 403 when user is not a project member", async () => {
      const projectId = "project-123";
      const userId = "user-123";

      const project = {
        id: projectId,
        ownerId: "owner-123",
      };

      (prisma.project.findUnique as jest.Mock).mockResolvedValue(project);

      (prisma.projectMember.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(getProjectMembers(projectId, userId)).rejects.toEqual(
        new AppError("You are not a member of this project", 403)
      );

      expect(prisma.projectMember.findMany).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------
  // removeProjectMember
  // --------------------------------------------------

  describe("removeProjectMember", () => {
    it("should remove a project member", async () => {
      const projectId = "project-123";
      const userId = "user-123";

      const member = {
        projectId,
        userId,
        role: "MEMBER",
      };

      (prisma.projectMember.findUnique as jest.Mock).mockResolvedValue(member);

      (prisma.projectMember.delete as jest.Mock).mockResolvedValue(member);

      const result = await removeProjectMember(projectId, userId);

      expect(prisma.projectMember.findUnique).toHaveBeenCalledWith({
        where: {
          projectId_userId: {
            projectId,
            userId,
          },
        },
      });

      expect(prisma.projectMember.delete).toHaveBeenCalledWith({
        where: {
          projectId_userId: {
            projectId,
            userId,
          },
        },
      });

      expect(result).toBeUndefined();
    });

    it("should throw 404 when project member does not exist", async () => {
      const projectId = "project-123";
      const userId = "user-123";

      (prisma.projectMember.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(removeProjectMember(projectId, userId)).rejects.toEqual(
        new AppError("Project member not found", 404)
      );

      expect(prisma.projectMember.delete).not.toHaveBeenCalled();
    });

    it("should throw 400 when trying to remove the project owner", async () => {
      const projectId = "project-123";
      const userId = "owner-123";

      const owner = {
        projectId,
        userId,
        role: "OWNER",
      };

      (prisma.projectMember.findUnique as jest.Mock).mockResolvedValue(owner);

      await expect(removeProjectMember(projectId, userId)).rejects.toEqual(
        new AppError("Project owner cannot be removed", 400)
      );

      expect(prisma.projectMember.delete).not.toHaveBeenCalled();
    });
  });
});
