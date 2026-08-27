import request from "supertest";
import app from "../../src/app";
import prisma from "../../src/config/prisma";
import { cleanDatabase, disconnectDatabase } from "../helpers/testDatabase";

describe("Projects Integration Tests", () => {
  let ownerAccessToken: string;
  let memberAccessToken: string;
  let outsiderAccessToken: string;

  let ownerId: string;
  let memberId: string;
  let projectId: string;

  beforeEach(async () => {
    await cleanDatabase();

    // Create owner
    await request(app).post("/api/v1/auth/register").send({
      name: "Project Owner",
      email: "owner@example.com",
      password: "password123",
    });

    const ownerLogin = await request(app).post("/api/v1/auth/login").send({
      email: "owner@example.com",
      password: "password123",
    });

    ownerAccessToken = ownerLogin.body.data.accessToken;
    ownerId = ownerLogin.body.data.user.id;

    // Create member
    await request(app).post("/api/v1/auth/register").send({
      name: "Project Member",
      email: "member@example.com",
      password: "password123",
    });

    const memberLogin = await request(app).post("/api/v1/auth/login").send({
      email: "member@example.com",
      password: "password123",
    });

    memberAccessToken = memberLogin.body.data.accessToken;
    memberId = memberLogin.body.data.user.id;

    // Create outsider
    await request(app).post("/api/v1/auth/register").send({
      name: "Project Outsider",
      email: "outsider@example.com",
      password: "password123",
    });

    const outsiderLogin = await request(app).post("/api/v1/auth/login").send({
      email: "outsider@example.com",
      password: "password123",
    });

    outsiderAccessToken = outsiderLogin.body.data.accessToken;

    // Create project as owner
    const projectResponse = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${ownerAccessToken}`)
      .send({
        name: "Test Project",
        description: "Test project description",
      });

    projectId = projectResponse.body.data.id;

    // Add member directly to test database
    await prisma.projectMember.create({
      data: {
        projectId,
        userId: memberId,
        role: "MEMBER",
      },
    });
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe("POST /api/v1/projects", () => {
    it("should create a project", async () => {
      const response = await request(app)
        .post("/api/v1/projects")
        .set("Authorization", `Bearer ${ownerAccessToken}`)
        .send({
          name: "New Project",
          description: "A new project",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data.name).toBe("New Project");
      expect(response.body.data.description).toBe("A new project");
      expect(response.body.data.ownerId).toBe(ownerId);
    });

    it("should reject unauthenticated project creation", async () => {
      const response = await request(app).post("/api/v1/projects").send({
        name: "New Project",
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe("Authentication required");
    });

    it("should reject an invalid project name", async () => {
      const response = await request(app)
        .post("/api/v1/projects")
        .set("Authorization", `Bearer ${ownerAccessToken}`)
        .send({
          name: "AB",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe("Validation failed");
      expect(response.body.error).toHaveProperty("details");
    });

    it("should reject a project description longer than 450 characters", async () => {
      const response = await request(app)
        .post("/api/v1/projects")
        .set("Authorization", `Bearer ${ownerAccessToken}`)
        .send({
          name: "Valid Project",
          description: "a".repeat(451),
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe("Validation failed");
    });
  });

  describe("GET /api/v1/projects", () => {
    it("should get projects belonging to the current user", async () => {
      const response = await request(app)
        .get("/api/v1/projects")
        .set("Authorization", `Bearer ${ownerAccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe(projectId);
      expect(response.body.data[0].name).toBe("Test Project");
    });

    it("should return projects where the user is a member", async () => {
      const response = await request(app)
        .get("/api/v1/projects")
        .set("Authorization", `Bearer ${memberAccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe(projectId);
    });

    it("should return an empty list for a user with no projects", async () => {
      const response = await request(app)
        .get("/api/v1/projects")
        .set("Authorization", `Bearer ${outsiderAccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it("should reject unauthenticated requests", async () => {
      const response = await request(app).get("/api/v1/projects");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/v1/projects/:id", () => {
    it("should allow the owner to view the project", async () => {
      const response = await request(app)
        .get(`/api/v1/projects/${projectId}`)
        .set("Authorization", `Bearer ${ownerAccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(projectId);
      expect(response.body.data.name).toBe("Test Project");
    });

    it("should allow a project member to view the project", async () => {
      const response = await request(app)
        .get(`/api/v1/projects/${projectId}`)
        .set("Authorization", `Bearer ${memberAccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(projectId);
    });

    it("should reject a non-member", async () => {
      const response = await request(app)
        .get(`/api/v1/projects/${projectId}`)
        .set("Authorization", `Bearer ${outsiderAccessToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe("You are not authorized to view this project");
    });

    it("should reject an invalid project ID", async () => {
      const response = await request(app)
        .get("/api/v1/projects/not-a-uuid")
        .set("Authorization", `Bearer ${ownerAccessToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe("Validation failed");
    });

    it("should return 404 for a non-existent project", async () => {
      const response = await request(app)
        .get("/api/v1/projects/00000000-0000-4000-8000-000000000000")
        .set("Authorization", `Bearer ${ownerAccessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe("Project not found");
    });
  });

  describe("PATCH /api/v1/projects/:id", () => {
    it("should allow the owner to update the project", async () => {
      const response = await request(app)
        .patch(`/api/v1/projects/${projectId}`)
        .set("Authorization", `Bearer ${ownerAccessToken}`)
        .send({
          name: "Updated Project",
          description: "Updated description",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe("Updated Project");
      expect(response.body.data.description).toBe("Updated description");
    });

    it("should reject a member from updating the project", async () => {
      const response = await request(app)
        .patch(`/api/v1/projects/${projectId}`)
        .set("Authorization", `Bearer ${memberAccessToken}`)
        .send({
          name: "Member Updated Project",
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe("You are not authorized to update this project");
    });

    it("should reject an outsider from updating the project", async () => {
      const response = await request(app)
        .patch(`/api/v1/projects/${projectId}`)
        .set("Authorization", `Bearer ${outsiderAccessToken}`)
        .send({
          name: "Outsider Updated Project",
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it("should reject invalid update data", async () => {
      const response = await request(app)
        .patch(`/api/v1/projects/${projectId}`)
        .set("Authorization", `Bearer ${ownerAccessToken}`)
        .send({
          name: "AB",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe("Validation failed");
    });

    it("should allow the owner to clear the description", async () => {
      const response = await request(app)
        .patch(`/api/v1/projects/${projectId}`)
        .set("Authorization", `Bearer ${ownerAccessToken}`)
        .send({
          description: null,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.description).toBeNull();
    });
  });

  describe("DELETE /api/v1/projects/:id", () => {
    it("should allow the owner to delete the project", async () => {
      const response = await request(app)
        .delete(`/api/v1/projects/${projectId}`)
        .set("Authorization", `Bearer ${ownerAccessToken}`);

      expect(response.status).toBe(204);

      const project = await prisma.project.findUnique({
        where: {
          id: projectId,
        },
      });

      expect(project).toBeNull();
    });

    it("should reject a member from deleting the project", async () => {
      const response = await request(app)
        .delete(`/api/v1/projects/${projectId}`)
        .set("Authorization", `Bearer ${memberAccessToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe("You are not authorized to delete this project");
    });

    it("should reject an outsider from deleting the project", async () => {
      const response = await request(app)
        .delete(`/api/v1/projects/${projectId}`)
        .set("Authorization", `Bearer ${outsiderAccessToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/v1/projects/:id/members", () => {
    it("should allow the owner to get project members", async () => {
      const response = await request(app)
        .get(`/api/v1/projects/${projectId}/members`)
        .set("Authorization", `Bearer ${ownerAccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data).toHaveLength(2);

      expect(
        response.body.data.some((member: { userId: string }) => member.userId === ownerId)
      ).toBe(true);

      expect(
        response.body.data.some((member: { userId: string }) => member.userId === memberId)
      ).toBe(true);
    });

    it("should allow a member to get project members", async () => {
      const response = await request(app)
        .get(`/api/v1/projects/${projectId}/members`)
        .set("Authorization", `Bearer ${memberAccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it("should reject a non-member", async () => {
      const response = await request(app)
        .get(`/api/v1/projects/${projectId}/members`)
        .set("Authorization", `Bearer ${outsiderAccessToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe("You are not a member of this project");
    });
  });

  describe("DELETE /api/v1/projects/:id/members/:userId", () => {
    it("should allow the owner to remove a member", async () => {
      const response = await request(app)
        .delete(`/api/v1/projects/${projectId}/members/${memberId}`)
        .set("Authorization", `Bearer ${ownerAccessToken}`);

      expect(response.status).toBe(204);

      const membership = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: memberId,
          },
        },
      });

      expect(membership).toBeNull();
    });

    it("should reject a member from removing another member", async () => {
      const response = await request(app)
        .delete(`/api/v1/projects/${projectId}/members/${ownerId}`)
        .set("Authorization", `Bearer ${memberAccessToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe("You are not authorized to perform this action");
    });

    it("should reject an outsider from removing a member", async () => {
      const response = await request(app)
        .delete(`/api/v1/projects/${projectId}/members/${memberId}`)
        .set("Authorization", `Bearer ${outsiderAccessToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it("should reject an invalid member user ID", async () => {
      const response = await request(app)
        .delete(`/api/v1/projects/${projectId}/members/not-a-uuid`)
        .set("Authorization", `Bearer ${ownerAccessToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe("Validation failed");
    });

    it("should reject removing the project owner", async () => {
      const response = await request(app)
        .delete(`/api/v1/projects/${projectId}/members/${ownerId}`)
        .set("Authorization", `Bearer ${ownerAccessToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe("Project owner cannot be removed");
    });
  });
});
