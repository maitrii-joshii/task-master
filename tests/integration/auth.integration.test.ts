import request from "supertest";
import app from "../../src/app";
import { cleanDatabase, disconnectDatabase } from "../helpers/testDatabase";

describe("Authentication Integration Tests", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe("POST /api/v1/auth/register", () => {
    it("should register a new user", async () => {
      const response = await request(app).post("/api/v1/auth/register").send({
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      });

      expect(response.status).toBe(201);

      expect(response.body.success).toBe(true);

      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data.name).toBe("John Doe");
      expect(response.body.data.email).toBe("john@example.com");

      expect(response.body.data).not.toHaveProperty("passwordHash");
    });

    it("should reject duplicate email", async () => {
      const user = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      };

      await request(app).post("/api/v1/auth/register").send(user);

      const response = await request(app).post("/api/v1/auth/register").send(user);

      expect(response.status).toBe(409);

      expect(response.body.success).toBe(false);

      expect(response.body.error.message).toBe("User with this email already exists");
    });

    it("should reject invalid registration data", async () => {
      const response = await request(app).post("/api/v1/auth/register").send({
        name: "Jo",
        email: "invalid-email",
        password: "123",
      });

      expect(response.status).toBe(400);

      expect(response.body.success).toBe(false);

      expect(response.body.error.message).toBe("Validation failed");

      expect(response.body.error).toHaveProperty("details");
    });
  });

  describe("POST /api/v1/auth/login", () => {
    beforeEach(async () => {
      await request(app).post("/api/v1/auth/register").send({
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      });
    });

    it("should login with valid credentials", async () => {
      const response = await request(app).post("/api/v1/auth/login").send({
        email: "john@example.com",
        password: "password123",
      });

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);

      expect(response.body.data).toHaveProperty("user");
      expect(response.body.data).toHaveProperty("accessToken");
      expect(response.body.data).toHaveProperty("refreshToken");

      expect(response.body.data.user.email).toBe("john@example.com");
    });

    it("should reject invalid password", async () => {
      const response = await request(app).post("/api/v1/auth/login").send({
        email: "john@example.com",
        password: "wrong-password",
      });

      expect(response.status).toBe(401);

      expect(response.body.success).toBe(false);

      expect(response.body.error.message).toBe("Invalid email or password");
    });

    it("should reject non-existent user", async () => {
      const response = await request(app).post("/api/v1/auth/login").send({
        email: "doesnotexist@example.com",
        password: "password123",
      });

      expect(response.status).toBe(401);

      expect(response.body.success).toBe(false);

      expect(response.body.error.message).toBe("Invalid email or password");
    });

    it("should reject invalid login data", async () => {
      const response = await request(app).post("/api/v1/auth/login").send({
        email: "invalid-email",
        password: "",
      });

      expect(response.status).toBe(400);

      expect(response.body.success).toBe(false);

      expect(response.body.error.message).toBe("Validation failed");

      expect(response.body.error).toHaveProperty("details");
    });
  });

  describe("POST /api/v1/auth/refresh", () => {
    let refreshToken: string;

    beforeEach(async () => {
      await request(app).post("/api/v1/auth/register").send({
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      });

      const loginResponse = await request(app).post("/api/v1/auth/login").send({
        email: "john@example.com",
        password: "password123",
      });

      refreshToken = loginResponse.body.data.refreshToken;
    });

    it("should refresh access token with valid refresh token", async () => {
      const response = await request(app).post("/api/v1/auth/refresh").send({
        refreshToken,
      });

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);

      expect(response.body.data).toHaveProperty("accessToken");
      expect(response.body.data).toHaveProperty("refreshToken");

      expect(response.body.data.refreshToken).not.toBe(refreshToken);
    });

    it("should reject an invalid refresh token", async () => {
      const response = await request(app).post("/api/v1/auth/refresh").send({
        refreshToken: "invalid-refresh-token",
      });

      expect(response.status).toBe(401);

      expect(response.body.success).toBe(false);

      expect(response.body.error).toHaveProperty("message");
    });

    it("should reject a missing refresh token", async () => {
      const response = await request(app).post("/api/v1/auth/refresh").send({});

      expect(response.status).toBe(400);

      expect(response.body.success).toBe(false);

      expect(response.body.error.message).toBe("Validation failed");

      expect(response.body.error).toHaveProperty("details");
    });
  });

  describe("POST /api/v1/auth/logout", () => {
    let refreshToken: string;

    beforeEach(async () => {
      await request(app).post("/api/v1/auth/register").send({
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      });

      const loginResponse = await request(app).post("/api/v1/auth/login").send({
        email: "john@example.com",
        password: "password123",
      });

      refreshToken = loginResponse.body.data.refreshToken;
    });

    it("should logout successfully", async () => {
      const response = await request(app).post("/api/v1/auth/logout").send({
        refreshToken,
      });

      expect(response.status).toBe(204);
    });

    it("should logout successfully with an invalid refresh token", async () => {
      const response = await request(app).post("/api/v1/auth/logout").send({
        refreshToken: "invalid-refresh-token",
      });

      expect(response.status).toBe(204);
    });

    it("should reject a missing refresh token", async () => {
      const response = await request(app).post("/api/v1/auth/logout").send({});

      expect(response.status).toBe(400);

      expect(response.body.success).toBe(false);

      expect(response.body.error.message).toBe("Validation failed");

      expect(response.body.error).toHaveProperty("details");
    });
  });
});
