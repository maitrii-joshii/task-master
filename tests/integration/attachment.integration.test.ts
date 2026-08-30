import request from "supertest";
import app from "../../src/app";
import prisma from "../../src/config/prisma";
import { Buffer } from "node:buffer";

// ============================================================
// ATTACHMENT INTEGRATION TESTS
// ============================================================

describe("Attachment Integration Tests", () => {
  let userId: string;
  let accessToken: string;
  let taskId: string;
  let attachmentId: string;

  const testEmail = `attachment-test-${Date.now()}@example.com`;
  const testPassword = "Password@123";

  // ============================================================
  // SETUP
  // ============================================================

  beforeAll(async () => {
    // ----------------------------------------------------------
    // Register user
    // ----------------------------------------------------------

    const registerResponse = await request(app).post("/api/v1/auth/register").send({
      name: "Attachment Test User",
      email: testEmail,
      password: testPassword,
    });

    expect([200, 201]).toContain(registerResponse.status);

    userId = registerResponse.body.data.id;

    // ----------------------------------------------------------
    // Login
    // ----------------------------------------------------------

    const loginResponse = await request(app).post("/api/v1/auth/login").send({
      email: testEmail,
      password: testPassword,
    });

    expect(loginResponse.status).toBe(200);

    accessToken = loginResponse.body.data.accessToken;

    // ----------------------------------------------------------
    // Create task
    // ----------------------------------------------------------

    const taskResponse = await request(app)
      .post("/api/v1/tasks")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "Attachment integration test task",
        description: "Task used for attachment integration tests",
      });

    expect(taskResponse.status).toBe(201);

    taskId = taskResponse.body.data.id;
  });

  // ============================================================
  // CLEANUP
  // ============================================================

  afterAll(async () => {
    if (taskId) {
      await prisma.attachment
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
  // POST /api/v1/tasks/:taskId/attachments
  // ============================================================

  describe("POST /api/v1/tasks/:taskId/attachments", () => {
    it("should upload an attachment successfully", async () => {
      const response = await request(app)
        .post(`/api/v1/tasks/${taskId}/attachments`)
        .set("Authorization", `Bearer ${accessToken}`)
        .attach("file", Buffer.from("This is an integration test file."), "test.txt");

      expect(response.status).toBe(201);

      expect(response.body.success).toBe(true);

      expect(response.body.data).toHaveProperty("id");

      expect(typeof response.body.data.id).toBe("string");

      expect(response.body.data.taskId).toBe(taskId);

      expect(response.body.data.fileName).toBe("test.txt");

      expect(response.body.data.mimeType).toBe("text/plain");

      // Actual API field is fileSize, not size
      expect(response.body.data.fileSize).toBeGreaterThan(0);

      expect(response.body.data).toHaveProperty("fileUrl");

      expect(typeof response.body.data.fileUrl).toBe("string");

      expect(response.body.data).toHaveProperty("storageKey");

      expect(typeof response.body.data.storageKey).toBe("string");

      expect(response.body.data).toHaveProperty("uploadedById");

      expect(response.body.data.uploadedById).toBe(userId);

      // Save the real database-generated UUID.
      // Other tests use this ID.
      attachmentId = response.body.data.id;
    });

    it("should reject an unauthenticated request", async () => {
      const response = await request(app)
        .post(`/api/v1/tasks/${taskId}/attachments`)
        .attach("file", Buffer.from("Unauthenticated test file."), "test.txt");

      expect(response.status).toBe(401);
    });

    it("should reject an invalid task ID", async () => {
      const response = await request(app)
        .post("/api/v1/tasks/not-a-uuid/attachments")
        .set("Authorization", `Bearer ${accessToken}`)
        .attach("file", Buffer.from("Invalid task ID file."), "test.txt");

      expect(response.status).toBe(400);
    });

    it("should return 404 when task does not exist", async () => {
      const nonExistingTaskId = "99999999-9999-4999-8999-999999999999";

      const response = await request(app)
        .post(`/api/v1/tasks/${nonExistingTaskId}/attachments`)
        .set("Authorization", `Bearer ${accessToken}`)
        .attach("file", Buffer.from("Missing task file."), "test.txt");

      expect(response.status).toBe(404);
    });

    it("should reject the request when no file is provided", async () => {
      const response = await request(app)
        .post(`/api/v1/tasks/${taskId}/attachments`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(400);
    });
  });

  // ============================================================
  // GET /api/v1/tasks/:taskId/attachments
  // ============================================================

  describe("GET /api/v1/tasks/:taskId/attachments", () => {
    it("should return all attachments for a task", async () => {
      const response = await request(app)
        .get(`/api/v1/tasks/${taskId}/attachments`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);

      expect(Array.isArray(response.body.data)).toBe(true);

      expect(response.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: attachmentId,
            taskId,
            fileName: "test.txt",
            mimeType: "text/plain",
          }),
        ])
      );
    });

    it("should reject an unauthenticated request", async () => {
      const response = await request(app).get(`/api/v1/tasks/${taskId}/attachments`);

      expect(response.status).toBe(401);
    });

    it("should reject an invalid task ID", async () => {
      const response = await request(app)
        .get("/api/v1/tasks/not-a-uuid/attachments")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(400);
    });

    it("should return 404 when task does not exist", async () => {
      const nonExistingTaskId = "99999999-9999-4999-8999-999999999999";

      const response = await request(app)
        .get(`/api/v1/tasks/${nonExistingTaskId}/attachments`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
    });
  });

  // ============================================================
  // GET /api/v1/tasks/:taskId/attachments/:attachmentId
  // ============================================================

  describe("GET /api/v1/tasks/:taskId/attachments/:attachmentId", () => {
    it("should return a single attachment", async () => {
      const response = await request(app)
        .get(`/api/v1/tasks/${taskId}/attachments/${attachmentId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);

      expect(response.body.data).toMatchObject({
        id: attachmentId,
        taskId,
        fileName: "test.txt",
        mimeType: "text/plain",
      });

      expect(response.body.data).toHaveProperty("fileUrl");

      expect(response.body.data).toHaveProperty("fileSize");

      expect(response.body.data).toHaveProperty("storageKey");
    });

    it("should reject an unauthenticated request", async () => {
      const response = await request(app).get(
        `/api/v1/tasks/${taskId}/attachments/${attachmentId}`
      );

      expect(response.status).toBe(401);
    });

    it("should reject an invalid task ID", async () => {
      const response = await request(app)
        .get(`/api/v1/tasks/not-a-uuid/attachments/${attachmentId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(400);
    });

    it("should reject an invalid attachment ID", async () => {
      const response = await request(app)
        .get(`/api/v1/tasks/${taskId}/attachments/not-a-uuid`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(400);
    });

    it("should return 404 when attachment does not exist", async () => {
      const nonExistingAttachmentId = "99999999-9999-4999-8999-999999999999";

      const response = await request(app)
        .get(`/api/v1/tasks/${taskId}/attachments/${nonExistingAttachmentId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
    });
  });

  // ============================================================
  // DELETE /api/v1/tasks/:taskId/attachments/:attachmentId
  // ============================================================

  describe("DELETE /api/v1/tasks/:taskId/attachments/:attachmentId", () => {
    it("should reject an unauthenticated request", async () => {
      const response = await request(app).delete(
        `/api/v1/tasks/${taskId}/attachments/${attachmentId}`
      );

      expect(response.status).toBe(401);
    });

    it("should reject an invalid task ID", async () => {
      const response = await request(app)
        .delete(`/api/v1/tasks/not-a-uuid/attachments/${attachmentId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(400);
    });

    it("should reject an invalid attachment ID", async () => {
      const response = await request(app)
        .delete(`/api/v1/tasks/${taskId}/attachments/not-a-uuid`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(400);
    });

    it("should return 404 when attachment does not exist", async () => {
      const nonExistingAttachmentId = "99999999-9999-4999-8999-999999999999";

      const response = await request(app)
        .delete(`/api/v1/tasks/${taskId}/attachments/${nonExistingAttachmentId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
    });

    it("should delete the attachment successfully", async () => {
      const response = await request(app)
        .delete(`/api/v1/tasks/${taskId}/attachments/${attachmentId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(204);

      const deletedAttachment = await prisma.attachment.findUnique({
        where: {
          id: attachmentId,
        },
      });

      expect(deletedAttachment).toBeNull();
    });
  });
});
