import request from "supertest";
import app from "../../src/app";
import { cleanDatabase, disconnectDatabase } from "../helpers/testDatabase";

describe("Users Integration Tests", () => {
  let accessToken: string;

  beforeEach(async () => {
    await cleanDatabase();

    await request(app).post("/api/v1/auth/register").send({
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
    });

    const loginResponse = await request(app).post("/api/v1/auth/login").send({
      email: "john@example.com",
      password: "password123",
    });

    accessToken = loginResponse.body.data.accessToken;
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe("GET /api/v1/users/profile", () => {
    it("should get the current user profile", async () => {
      const response = await request(app)
        .get("/api/v1/users/profile")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);

      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data.name).toBe("John Doe");
      expect(response.body.data.email).toBe("john@example.com");

      expect(response.body.data).not.toHaveProperty("passwordHash");
    });

    it("should reject unauthenticated request", async () => {
      const response = await request(app).get("/api/v1/users/profile");

      expect(response.status).toBe(401);

      expect(response.body.success).toBe(false);

      expect(response.body.error.message).toBe("Authentication required");
    });

    it("should reject an invalid access token", async () => {
      const response = await request(app)
        .get("/api/v1/users/profile")
        .set("Authorization", "Bearer invalid-access-token");

      expect(response.status).toBe(401);

      expect(response.body.success).toBe(false);

      expect(response.body.error).toHaveProperty("message");
    });

    it("should reject an invalid authorization header", async () => {
      const response = await request(app)
        .get("/api/v1/users/profile")
        .set("Authorization", "Basic invalid-token");

      expect(response.status).toBe(401);

      expect(response.body.success).toBe(false);

      expect(response.body.error.message).toBe("Invalid authorization header");
    });
  });

  describe("PATCH /api/v1/users/profile", () => {
    it("should update the current user's name", async () => {
      const response = await request(app)
        .patch("/api/v1/users/profile")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Jane Doe",
        });

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);

      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data.name).toBe("Jane Doe");
      expect(response.body.data.email).toBe("john@example.com");

      expect(response.body.data).not.toHaveProperty("passwordHash");
    });

    it("should reject unauthenticated update", async () => {
      const response = await request(app).patch("/api/v1/users/profile").send({
        name: "Jane Doe",
      });

      expect(response.status).toBe(401);

      expect(response.body.success).toBe(false);

      expect(response.body.error.message).toBe("Authentication required");
    });

    it("should reject a name shorter than 3 characters", async () => {
      const response = await request(app)
        .patch("/api/v1/users/profile")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Jo",
        });

      expect(response.status).toBe(400);

      expect(response.body.success).toBe(false);

      expect(response.body.error.message).toBe("Validation failed");

      expect(response.body.error).toHaveProperty("details");
    });

    it("should reject a name longer than 90 characters", async () => {
      const response = await request(app)
        .patch("/api/v1/users/profile")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "a".repeat(91),
        });

      expect(response.status).toBe(400);

      expect(response.body.success).toBe(false);

      expect(response.body.error.message).toBe("Validation failed");

      expect(response.body.error).toHaveProperty("details");
    });

    it("should reject unknown fields", async () => {
      const response = await request(app)
        .patch("/api/v1/users/profile")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Jane Doe",
          email: "changed@example.com",
        });

      expect(response.status).toBe(400);

      expect(response.body.success).toBe(false);

      expect(response.body.error.message).toBe("Validation failed");

      expect(response.body.error).toHaveProperty("details");
    });

    it("should accept an empty update object", async () => {
      const response = await request(app)
        .patch("/api/v1/users/profile")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({});

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);

      expect(response.body.data.name).toBe("John Doe");
      expect(response.body.data.email).toBe("john@example.com");
    });
  });
});
