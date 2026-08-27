import request from "supertest";
import app from "../../src/app";
import prisma from "../../src/config/prisma";
import { cleanDatabase, disconnectDatabase } from "../helpers/testDatabase";

describe("Task Integration Tests", () => {
  let creatorAccessToken: string;
  let memberAccessToken: string;
  let outsiderAccessToken: string;

  let creatorId: string;
  let memberId: string;
  let outsiderId: string;

  let projectId: string;
  let personalTaskId: string;
  let projectTaskId: string;

  beforeAll(async () => {
    await cleanDatabase();

    // Create creator
    const creatorResponse = await request(app).post("/api/v1/auth/register").send({
      name: "Task Creator",
      email: "task.creator@example.com",
      password: "Password123!",
    });

    creatorId = creatorResponse.body.data.id;

    const creatorLogin = await request(app).post("/api/v1/auth/login").send({
      email: "task.creator@example.com",
      password: "Password123!",
    });

    creatorAccessToken = creatorLogin.body.data.accessToken;

    // Create member
    const memberResponse = await request(app).post("/api/v1/auth/register").send({
      name: "Task Member",
      email: "task.member@example.com",
      password: "Password123!",
    });

    memberId = memberResponse.body.data.id;

    const memberLogin = await request(app).post("/api/v1/auth/login").send({
      email: "task.member@example.com",
      password: "Password123!",
    });

    memberAccessToken = memberLogin.body.data.accessToken;

    // Create outsider
    const outsiderResponse = await request(app).post("/api/v1/auth/register").send({
      name: "Task Outsider",
      email: "task.outsider@example.com",
      password: "Password123!",
    });

    outsiderId = outsiderResponse.body.data.id;

    const outsiderLogin = await request(app).post("/api/v1/auth/login").send({
      email: "task.outsider@example.com",
      password: "Password123!",
    });

    outsiderAccessToken = outsiderLogin.body.data.accessToken;

    // Create project
    const projectResponse = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${creatorAccessToken}`)
      .send({
        name: "Task Test Project",
        description: "Project used for task integration tests",
      });

    expect(projectResponse.status).toBe(201);

    projectId = projectResponse.body.data.id;

    // Add member directly to the test database.
    await prisma.projectMember.create({
      data: {
        projectId,
        userId: memberId,
        role: "MEMBER",
      },
    });
  });

  afterAll(async () => {
    await cleanDatabase();
    await disconnectDatabase();
  });

  describe("POST /api/v1/tasks", () => {
    it("should create a personal task", async () => {
      const response = await request(app)
        .post("/api/v1/tasks")
        .set("Authorization", `Bearer ${creatorAccessToken}`)
        .send({
          title: "Personal Task",
          description: "Personal task description",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data.title).toBe("Personal Task");
      expect(response.body.data.creatorId).toBe(creatorId);
      expect(response.body.data.projectId).toBeNull();

      personalTaskId = response.body.data.id;
    });

    it("should create a project task", async () => {
      const response = await request(app)
        .post("/api/v1/tasks")
        .set("Authorization", `Bearer ${creatorAccessToken}`)
        .send({
          title: "Project Task",
          description: "Project task description",
          projectId,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe("Project Task");
      expect(response.body.data.projectId).toBe(projectId);
      expect(response.body.data.creatorId).toBe(creatorId);

      projectTaskId = response.body.data.id;
    });

    it("should create a project task assigned to a project member", async () => {
      const response = await request(app)
        .post("/api/v1/tasks")
        .set("Authorization", `Bearer ${creatorAccessToken}`)
        .send({
          title: "Assigned Project Task",
          projectId,
          assigneeId: memberId,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.assigneeId).toBe(memberId);
    });

    it("should reject an unauthenticated request", async () => {
      const response = await request(app).post("/api/v1/tasks").send({
        title: "Unauthorized Task",
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should reject an invalid task payload", async () => {
      const response = await request(app)
        .post("/api/v1/tasks")
        .set("Authorization", `Bearer ${creatorAccessToken}`)
        .send({
          title: "",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject creating a project task when the user is not a member", async () => {
      const response = await request(app)
        .post("/api/v1/tasks")
        .set("Authorization", `Bearer ${outsiderAccessToken}`)
        .send({
          title: "Unauthorized Project Task",
          projectId,
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe("You are not a member of this project");
    });

    it("should reject assigning a project task to a non-member", async () => {
      const response = await request(app)
        .post("/api/v1/tasks")
        .set("Authorization", `Bearer ${creatorAccessToken}`)
        .send({
          title: "Invalid Assignee Task",
          projectId,
          assigneeId: outsiderId,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe("Assignee is not a member of this project");
    });
  });

  describe("GET /api/v1/tasks/:id", () => {
    it("should get a personal task", async () => {
      const response = await request(app)
        .get(`/api/v1/tasks/${personalTaskId}`)
        .set("Authorization", `Bearer ${creatorAccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(personalTaskId);
    });

    it("should get a project task as a project member", async () => {
      const response = await request(app)
        .get(`/api/v1/tasks/${projectTaskId}`)
        .set("Authorization", `Bearer ${memberAccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(projectTaskId);
    });

    it("should reject an outsider from viewing a project task", async () => {
      const response = await request(app)
        .get(`/api/v1/tasks/${projectTaskId}`)
        .set("Authorization", `Bearer ${outsiderAccessToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe("You are not a member of this project");
    });

    it("should reject a non-existent task", async () => {
      const response = await request(app)
        .get("/api/v1/tasks/00000000-0000-4000-8000-000000000000")
        .set("Authorization", `Bearer ${creatorAccessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe("Task not found");
    });

    it("should reject an invalid task ID", async () => {
      const response = await request(app)
        .get("/api/v1/tasks/not-a-uuid")
        .set("Authorization", `Bearer ${creatorAccessToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/v1/tasks", () => {
    it("should get visible tasks", async () => {
      const response = await request(app)
        .get("/api/v1/tasks")
        .set("Authorization", `Bearer ${creatorAccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty("pagination");
    });

    it("should filter tasks by project", async () => {
      const response = await request(app)
        .get(`/api/v1/tasks?projectId=${projectId}`)
        .set("Authorization", `Bearer ${creatorAccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      for (const task of response.body.data) {
        expect(task.projectId).toBe(projectId);
      }
    });

    it("should filter tasks by status", async () => {
      const response = await request(app)
        .get("/api/v1/tasks?status=OPEN")
        .set("Authorization", `Bearer ${creatorAccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      for (const task of response.body.data) {
        expect(task.status).toBe("OPEN");
      }
    });

    it("should support pagination", async () => {
      const response = await request(app)
        .get("/api/v1/tasks?page=1&limit=2")
        .set("Authorization", `Bearer ${creatorAccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
    });

    it("should reject invalid query parameters", async () => {
      const response = await request(app)
        .get("/api/v1/tasks?limit=101")
        .set("Authorization", `Bearer ${creatorAccessToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject an unauthenticated request", async () => {
      const response = await request(app).get("/api/v1/tasks");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("PATCH /api/v1/tasks/:id", () => {
    it("should update a task", async () => {
      const response = await request(app)
        .patch(`/api/v1/tasks/${personalTaskId}`)
        .set("Authorization", `Bearer ${creatorAccessToken}`)
        .send({
          title: "Updated Personal Task",
          description: "Updated description",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe("Updated Personal Task");
      expect(response.body.data.description).toBe("Updated description");
    });

    it("should reject an outsider from updating a project task", async () => {
      const response = await request(app)
        .patch(`/api/v1/tasks/${projectTaskId}`)
        .set("Authorization", `Bearer ${outsiderAccessToken}`)
        .send({
          title: "Unauthorized Update",
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe("You are not a member of this project");
    });

    it("should reject invalid update data", async () => {
      const response = await request(app)
        .patch(`/api/v1/tasks/${personalTaskId}`)
        .set("Authorization", `Bearer ${creatorAccessToken}`)
        .send({
          title: "",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("PATCH /api/v1/tasks/:id/assign", () => {
    it("should assign a personal task", async () => {
      const response = await request(app)
        .patch(`/api/v1/tasks/${personalTaskId}/assign`)
        .set("Authorization", `Bearer ${creatorAccessToken}`)
        .send({
          assigneeId: memberId,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.assigneeId).toBe(memberId);
    });

    it("should assign a project task to a project member", async () => {
      const response = await request(app)
        .patch(`/api/v1/tasks/${projectTaskId}/assign`)
        .set("Authorization", `Bearer ${creatorAccessToken}`)
        .send({
          assigneeId: memberId,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.assigneeId).toBe(memberId);
    });

    it("should reject assigning a project task to a non-member", async () => {
      const response = await request(app)
        .patch(`/api/v1/tasks/${projectTaskId}/assign`)
        .set("Authorization", `Bearer ${creatorAccessToken}`)
        .send({
          assigneeId: outsiderId,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe("Assignee is not a member of this project");
    });

    it("should reject assignment by an outsider", async () => {
      const response = await request(app)
        .patch(`/api/v1/tasks/${projectTaskId}/assign`)
        .set("Authorization", `Bearer ${outsiderAccessToken}`)
        .send({
          assigneeId: memberId,
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe("You are not a member of this project");
    });
  });

  describe("PATCH /api/v1/tasks/:id/status", () => {
    it("should update task status", async () => {
      const response = await request(app)
        .patch(`/api/v1/tasks/${personalTaskId}/status`)
        .set("Authorization", `Bearer ${creatorAccessToken}`)
        .send({
          status: "IN_PROGRESS",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("IN_PROGRESS");
    });

    it("should reject updating to the same status", async () => {
      const response = await request(app)
        .patch(`/api/v1/tasks/${personalTaskId}/status`)
        .set("Authorization", `Bearer ${creatorAccessToken}`)
        .send({
          status: "IN_PROGRESS",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe("Task is already IN_PROGRESS");
    });

    it("should reject an invalid status", async () => {
      const response = await request(app)
        .patch(`/api/v1/tasks/${personalTaskId}/status`)
        .set("Authorization", `Bearer ${creatorAccessToken}`)
        .send({
          status: "INVALID_STATUS",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject an outsider from updating a project task", async () => {
      const response = await request(app)
        .patch(`/api/v1/tasks/${projectTaskId}/status`)
        .set("Authorization", `Bearer ${outsiderAccessToken}`)
        .send({
          status: "COMPLETED",
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe("You are not a member of this project");
    });
  });

  describe("DELETE /api/v1/tasks/:id", () => {
    it("should reject an outsider from deleting a project task", async () => {
      const response = await request(app)
        .delete(`/api/v1/tasks/${projectTaskId}`)
        .set("Authorization", `Bearer ${outsiderAccessToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe("You are not a member of this project");
    });

    it("should delete a personal task", async () => {
      const taskToDelete = await prisma.task.create({
        data: {
          title: "Task To Delete",
          creatorId,
        },
      });

      const response = await request(app)
        .delete(`/api/v1/tasks/${taskToDelete.id}`)
        .set("Authorization", `Bearer ${creatorAccessToken}`);

      expect(response.status).toBe(204);

      const deletedTask = await prisma.task.findUnique({
        where: {
          id: taskToDelete.id,
        },
      });

      expect(deletedTask).toBeNull();
    });

    it("should reject deleting a non-existent task", async () => {
      const response = await request(app)
        .delete("/api/v1/tasks/00000000-0000-4000-8000-000000000000")
        .set("Authorization", `Bearer ${creatorAccessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe("Task not found");
    });
  });
});
