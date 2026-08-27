import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../../src/middleware/auth.middleware";
import {
  createProject,
  updateProject,
  getProjectById,
  getProjects,
  deleteProject,
  getProjectMembers,
  removeProjectMember,
} from "../../../src/modules/projects/project.service";
import {
  createProjectController,
  updateProjectController,
  getProjectByIdController,
  getProjectsController,
  deleteProjectController,
  getProjectMembersController,
  removeProjectMemberController,
} from "../../../src/modules/projects/project.controller";

jest.mock("../../../src/modules/projects/project.service", () => ({
  createProject: jest.fn(),
  updateProject: jest.fn(),
  getProjectById: jest.fn(),
  getProjects: jest.fn(),
  deleteProject: jest.fn(),
  getProjectMembers: jest.fn(),
  removeProjectMember: jest.fn(),
}));

const mockedCreateProject = createProject as jest.MockedFunction<typeof createProject>;
const mockedUpdateProject = updateProject as jest.MockedFunction<typeof updateProject>;
const mockedGetProjectById = getProjectById as jest.MockedFunction<typeof getProjectById>;
const mockedGetProjects = getProjects as jest.MockedFunction<typeof getProjects>;
const mockedDeleteProject = deleteProject as jest.MockedFunction<typeof deleteProject>;
const mockedGetProjectMembers = getProjectMembers as jest.MockedFunction<typeof getProjectMembers>;
const mockedRemoveProjectMember = removeProjectMember as jest.MockedFunction<
  typeof removeProjectMember
>;

const createResponseMock = () => {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
    send: jest.fn(),
  } as unknown as Response;

  (res.status as jest.Mock).mockReturnValue(res);
  (res.json as jest.Mock).mockReturnValue(res);
  (res.send as jest.Mock).mockReturnValue(res);

  return res;
};

const createRequestMock = (overrides: Partial<AuthenticatedRequest> = {}): AuthenticatedRequest => {
  return {
    userId: "11111111-1111-4111-8111-111111111111",
    body: {},
    params: {},
    ...overrides,
  } as AuthenticatedRequest;
};

describe("Project Controllers", () => {
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    res = createResponseMock();
    next = jest.fn();
  });

  describe("createProjectController", () => {
    it("should create a project and return 201", async () => {
      const req = createRequestMock({
        body: {
          name: "TaskMaster",
          description: "Task management project",
        },
      });

      const project = {
        id: "22222222-2222-4222-8222-222222222222",
        name: "TaskMaster",
        description: "Task management project",
      };

      mockedCreateProject.mockResolvedValue(project as never);

      await createProjectController(req, res, next);

      expect(mockedCreateProject).toHaveBeenCalledWith(req.userId, req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: project,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should pass service errors to next", async () => {
      const req = createRequestMock({
        body: {
          name: "TaskMaster",
        },
      });

      const error = new Error("Failed to create project");

      mockedCreateProject.mockRejectedValue(error);

      await createProjectController(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("updateProjectController", () => {
    it("should update a project and return 200", async () => {
      const projectId = "22222222-2222-4222-8222-222222222222";

      const req = createRequestMock({
        params: {
          id: projectId,
        },
        body: {
          name: "Updated Project",
        },
      });

      const project = {
        id: projectId,
        name: "Updated Project",
      };

      mockedUpdateProject.mockResolvedValue(project as never);

      await updateProjectController(req, res, next);

      expect(mockedUpdateProject).toHaveBeenCalledWith(projectId, req.userId, req.body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: project,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should pass service errors to next", async () => {
      const error = new Error("Project not found");

      const req = createRequestMock({
        params: {
          id: "22222222-2222-4222-8222-222222222222",
        },
        body: {
          name: "Updated Project",
        },
      });

      mockedUpdateProject.mockRejectedValue(error);

      await updateProjectController(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("getProjectByIdController", () => {
    it("should return project with status 200", async () => {
      const projectId = "22222222-2222-4222-8222-222222222222";

      const req = createRequestMock({
        params: {
          id: projectId,
        },
      });

      const project = {
        id: projectId,
        name: "TaskMaster",
      };

      mockedGetProjectById.mockResolvedValue(project as never);

      await getProjectByIdController(req, res, next);

      expect(mockedGetProjectById).toHaveBeenCalledWith(projectId, req.userId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: project,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should pass service errors to next", async () => {
      const error = new Error("Project not found");

      const req = createRequestMock({
        params: {
          id: "22222222-2222-4222-8222-222222222222",
        },
      });

      mockedGetProjectById.mockRejectedValue(error);

      await getProjectByIdController(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("getProjectsController", () => {
    it("should return projects with status 200", async () => {
      const req = createRequestMock();

      const projects = [
        {
          id: "22222222-2222-4222-8222-222222222222",
          name: "TaskMaster",
        },
      ];

      mockedGetProjects.mockResolvedValue(projects as never);

      await getProjectsController(req, res, next);

      expect(mockedGetProjects).toHaveBeenCalledWith(req.userId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: projects,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should pass service errors to next", async () => {
      const error = new Error("Failed to fetch projects");

      const req = createRequestMock();

      mockedGetProjects.mockRejectedValue(error);

      await getProjectsController(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("deleteProjectController", () => {
    it("should delete a project and return 204", async () => {
      const projectId = "22222222-2222-4222-8222-222222222222";

      const req = createRequestMock({
        params: {
          id: projectId,
        },
      });

      mockedDeleteProject.mockResolvedValue(undefined);

      await deleteProjectController(req, res, next);

      expect(mockedDeleteProject).toHaveBeenCalledWith(projectId, req.userId);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it("should pass service errors to next", async () => {
      const error = new Error("You are not authorized");

      const req = createRequestMock({
        params: {
          id: "22222222-2222-4222-8222-222222222222",
        },
      });

      mockedDeleteProject.mockRejectedValue(error);

      await deleteProjectController(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("getProjectMembersController", () => {
    it("should return project members with status 200", async () => {
      const projectId = "22222222-2222-4222-8222-222222222222";

      const req = createRequestMock({
        params: {
          id: projectId,
        },
      });

      const members = [
        {
          id: "33333333-3333-4333-8333-333333333333",
          projectId,
          userId: req.userId,
          role: "OWNER",
        },
      ];

      mockedGetProjectMembers.mockResolvedValue(members as never);

      await getProjectMembersController(req, res, next);

      expect(mockedGetProjectMembers).toHaveBeenCalledWith(projectId, req.userId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: members,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should pass service errors to next", async () => {
      const error = new Error("You are not a member");

      const req = createRequestMock({
        params: {
          id: "22222222-2222-4222-8222-222222222222",
        },
      });

      mockedGetProjectMembers.mockRejectedValue(error);

      await getProjectMembersController(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("removeProjectMemberController", () => {
    it("should remove a project member and return 204", async () => {
      const projectId = "22222222-2222-4222-8222-222222222222";
      const memberUserId = "33333333-3333-4333-8333-333333333333";

      const req = createRequestMock({
        params: {
          id: projectId,
          userId: memberUserId,
        },
      });

      mockedRemoveProjectMember.mockResolvedValue(undefined);

      await removeProjectMemberController(req, res, next);

      expect(mockedRemoveProjectMember).toHaveBeenCalledWith(projectId, memberUserId);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it("should pass service errors to next", async () => {
      const error = new Error("Project member not found");

      const req = createRequestMock({
        params: {
          id: "22222222-2222-4222-8222-222222222222",
          userId: "33333333-3333-4333-8333-333333333333",
        },
      });

      mockedRemoveProjectMember.mockRejectedValue(error);

      await removeProjectMemberController(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
