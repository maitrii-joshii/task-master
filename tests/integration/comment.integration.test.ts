import request from "supertest";

import app from "../../src/app";
import prisma from "../../src/config/prisma";

describe("Comments Integration Tests", () => {
  let userId: string;
  let accessToken: string;
  let taskId: string;
  let commentId: string;

  const testEmail = `comment-test-${Date.now()}@example.com`;
  const testPassword = "Password@123";

  beforeAll(async () => {
    /*
     * Create test user
     *
     * Adjust this setup if your project already has
     * a shared integration-test user/helper.
     */
    const registerResponse = await request(app).post("/api/v1/auth/register").send({
      name: "Comment Test User",
      email: testEmail,
      password: testPassword,
    });

    expect([200, 201]).toContain(registerResponse.status);

    userId = registerResponse.body.data.id;

    /*
     * Login
     */
    const loginResponse = await request(app).post("/api/v1/auth/login").send({
      email: testEmail,
      password: testPassword,
    });

    expect(loginResponse.status).toBe(200);

    accessToken = loginResponse.body.data.accessToken;

    /*
     * Create a task
     */
    const taskResponse = await request(app)
      .post("/api/v1/tasks")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "Comment integration test task",
        description: "Task used for comment integration tests",
      });

    expect(taskResponse.status).toBe(201);

    taskId = taskResponse.body.data.id;
  });

  afterAll(async () => {
    /*
     * Cleanup comments and task/user created by this test.
     *
     * If your Prisma schema has cascading deletes,
     * deleting the task may be enough.
     */
    if (commentId) {
      await prisma.comment
        .deleteMany({
          where: {
            taskId,
          },
        })
        .catch(() => undefined);
    }

    if (taskId) {
      await prisma.task
        .delete({
          where: {
            id: taskId,
          },
        })
        .catch(() => undefined);
    }

    if (userId) {
      await prisma.user
        .delete({
          where: {
            id: userId,
          },
        })
        .catch(() => undefined);
    }

    await prisma.$disconnect();
  });

  // ============================================================
  // POST /tasks/:taskId/comments
  // ============================================================

  describe("POST /api/v1/tasks/:taskId/comments", () => {
    it("should create a comment on a task", async () => {
      const response = await request(app)
        .post(`/api/v1/tasks/${taskId}/comments`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          content: "This is an integration test comment.",
        });

      expect(response.status).toBe(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          content: "This is an integration test comment.",
          taskId,
          authorId: userId,
        },
      });

      expect(response.body.data.id).toBeDefined();

      commentId = response.body.data.id;
    });

    it("should reject an unauthenticated request", async () => {
      const response = await request(app).post(`/api/v1/tasks/${taskId}/comments`).send({
        content: "Unauthenticated comment",
      });

      expect(response.status).toBe(401);
    });

    it("should reject invalid task ID", async () => {
      const response = await request(app)
        .post("/api/v1/tasks/not-a-uuid/comments")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          content: "Invalid task ID",
        });

      expect(response.status).toBe(400);
    });

    it("should reject empty comment content", async () => {
      const response = await request(app)
        .post(`/api/v1/tasks/${taskId}/comments`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          content: "",
        });

      expect(response.status).toBe(400);
    });

    it("should reject comment content longer than 1500 characters", async () => {
      const response = await request(app)
        .post(`/api/v1/tasks/${taskId}/comments`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          content: "a".repeat(1501),
        });

      expect(response.status).toBe(400);
    });

    it("should return 404 for a non-existing task", async () => {
      const nonExistingTaskId = "99999999-9999-4999-8999-999999999999";

      const response = await request(app)
        .post(`/api/v1/tasks/${nonExistingTaskId}/comments`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          content: "Comment on missing task",
        });

      expect(response.status).toBe(404);
    });
  });

  // ============================================================
  // GET /tasks/:taskId/comments
  // ============================================================

  describe("GET /api/v1/tasks/:taskId/comments", () => {
    it("should return all comments for a task", async () => {
      const response = await request(app)
        .get(`/api/v1/tasks/${taskId}/comments`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);

      expect(response.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: commentId,
            taskId,
            content: "This is an integration test comment.",
          }),
        ])
      );
    });

    it("should reject an unauthenticated request", async () => {
      const response = await request(app).get(`/api/v1/tasks/${taskId}/comments`);

      expect(response.status).toBe(401);
    });

    it("should reject invalid task ID", async () => {
      const response = await request(app)
        .get("/api/v1/tasks/not-a-uuid/comments")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(400);
    });

    it("should return 404 for a non-existing task", async () => {
      const nonExistingTaskId = "99999999-9999-4999-8999-999999999999";

      const response = await request(app)
        .get(`/api/v1/tasks/${nonExistingTaskId}/comments`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
    });
  });

  // ============================================================
  // GET /tasks/:taskId/comments/:commentId
  // ============================================================

  describe("GET /api/v1/tasks/:taskId/comments/:commentId", () => {
    it("should return a single comment", async () => {
      const response = await request(app)
        .get(`/api/v1/tasks/${taskId}/comments/${commentId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: commentId,
          taskId,
          content: "This is an integration test comment.",
        },
      });
    });

    it("should reject an unauthenticated request", async () => {
      const response = await request(app).get(`/api/v1/tasks/${taskId}/comments/${commentId}`);

      expect(response.status).toBe(401);
    });

    it("should reject invalid task ID", async () => {
      const response = await request(app)
        .get(`/api/v1/tasks/not-a-uuid/comments/${commentId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(400);
    });

    it("should reject invalid comment ID", async () => {
      const response = await request(app)
        .get(`/api/v1/tasks/${taskId}/comments/not-a-uuid`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(400);
    });

    it("should return 404 for a non-existing comment", async () => {
      const nonExistingCommentId = "99999999-9999-4999-8999-999999999999";

      const response = await request(app)
        .get(`/api/v1/tasks/${taskId}/comments/${nonExistingCommentId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
    });

    it("should return 404 when comment does not belong to the task", async () => {
      const anotherTaskResponse = await request(app)
        .post("/api/v1/tasks")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          title: "Another task for comment test",
        });

      expect(anotherTaskResponse.status).toBe(201);

      const anotherTaskId = anotherTaskResponse.body.data.id;

      const response = await request(app)
        .get(`/api/v1/tasks/${anotherTaskId}/comments/${commentId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(404);

      await prisma.task
        .delete({
          where: {
            id: anotherTaskId,
          },
        })
        .catch(() => undefined);
    });
  });

  // ============================================================
  // PATCH /tasks/:taskId/comments/:commentId
  // ============================================================

  describe("PATCH /api/v1/tasks/:taskId/comments/:commentId", () => {
    it("should update the comment", async () => {
      const response = await request(app)
        .patch(`/api/v1/tasks/${taskId}/comments/${commentId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          content: "Updated integration test comment.",
        });

      expect(response.status).toBe(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: commentId,
          taskId,
          content: "Updated integration test comment.",
        },
      });
    });

    it("should reject an unauthenticated request", async () => {
      const response = await request(app)
        .patch(`/api/v1/tasks/${taskId}/comments/${commentId}`)
        .send({
          content: "Unauthorized update",
        });

      expect(response.status).toBe(401);
    });

    it("should reject invalid task ID", async () => {
      const response = await request(app)
        .patch(`/api/v1/tasks/not-a-uuid/comments/${commentId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          content: "Invalid task ID",
        });

      expect(response.status).toBe(400);
    });

    it("should reject invalid comment ID", async () => {
      const response = await request(app)
        .patch(`/api/v1/tasks/${taskId}/comments/not-a-uuid`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          content: "Invalid comment ID",
        });

      expect(response.status).toBe(400);
    });

    it("should reject empty content", async () => {
      const response = await request(app)
        .patch(`/api/v1/tasks/${taskId}/comments/${commentId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          content: "",
        });

      expect(response.status).toBe(400);
    });

    it("should return 404 for a non-existing comment", async () => {
      const nonExistingCommentId = "99999999-9999-4999-8999-999999999999";

      const response = await request(app)
        .patch(`/api/v1/tasks/${taskId}/comments/${nonExistingCommentId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          content: "Updated comment",
        });

      expect(response.status).toBe(404);
    });
  });

  // ============================================================
  // DELETE /tasks/:taskId/comments/:commentId
  // ============================================================

  describe("DELETE /api/v1/tasks/:taskId/comments/:commentId", () => {
    it("should delete the comment", async () => {
      const response = await request(app)
        .delete(`/api/v1/tasks/${taskId}/comments/${commentId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(204);

      const deletedComment = await prisma.comment.findUnique({
        where: {
          id: commentId,
        },
      });

      expect(deletedComment).toBeNull();
    });

    it("should reject an unauthenticated request", async () => {
      /*
       * Create another comment because the original comment
       * was deleted by the previous test.
       */
      const createResponse = await request(app)
        .post(`/api/v1/tasks/${taskId}/comments`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          content: "Comment for delete authentication test",
        });

      expect(createResponse.status).toBe(201);

      const newCommentId = createResponse.body.data.id;

      const response = await request(app).delete(
        `/api/v1/tasks/${taskId}/comments/${newCommentId}`
      );

      expect(response.status).toBe(401);

      await prisma.comment.delete({
        where: {
          id: newCommentId,
        },
      });
    });

    it("should reject invalid task ID", async () => {
      const response = await request(app)
        .delete(`/api/v1/tasks/not-a-uuid/comments/${commentId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(400);
    });

    it("should reject invalid comment ID", async () => {
      const response = await request(app)
        .delete(`/api/v1/tasks/${taskId}/comments/not-a-uuid`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(400);
    });

    it("should return 404 for a non-existing comment", async () => {
      const nonExistingCommentId = "99999999-9999-4999-8999-999999999999";

      const response = await request(app)
        .delete(`/api/v1/tasks/${taskId}/comments/${nonExistingCommentId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
    });
  });
});
