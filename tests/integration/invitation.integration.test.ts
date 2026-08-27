import request from "supertest";
import app from "../../src/app";
import prisma from "../../src/config/prisma";
import { cleanDatabase, disconnectDatabase } from "../helpers/testDatabase";

describe("Invitation Integration Tests", () => {
  let ownerAccessToken: string;
  let invitedUserAccessToken: string;
  let memberAccessToken: string;

  let ownerUserId: string;
  let invitedUserId: string;
  let memberUserId: string;

  let projectId: string;
  let invitationId: string;

  beforeEach(async () => {
    await cleanDatabase();

    // Create project owner
    const ownerResponse = await request(app).post("/api/v1/auth/register").send({
      name: "Project Owner",
      email: "owner@example.com",
      password: "password123",
    });

    expect(ownerResponse.status).toBe(201);

    ownerUserId = ownerResponse.body.data.id;

    const ownerLoginResponse = await request(app).post("/api/v1/auth/login").send({
      email: "owner@example.com",
      password: "password123",
    });

    expect(ownerLoginResponse.status).toBe(200);

    ownerAccessToken = ownerLoginResponse.body.data.accessToken;

    // Create invited user
    const invitedUserResponse = await request(app).post("/api/v1/auth/register").send({
      name: "Invited User",
      email: "invited@example.com",
      password: "password123",
    });

    expect(invitedUserResponse.status).toBe(201);

    invitedUserId = invitedUserResponse.body.data.id;

    const invitedUserLoginResponse = await request(app).post("/api/v1/auth/login").send({
      email: "invited@example.com",
      password: "password123",
    });

    expect(invitedUserLoginResponse.status).toBe(200);

    invitedUserAccessToken = invitedUserLoginResponse.body.data.accessToken;

    // Create another user who will be a MEMBER
    const memberResponse = await request(app).post("/api/v1/auth/register").send({
      name: "Project Member",
      email: "member@example.com",
      password: "password123",
    });

    expect(memberResponse.status).toBe(201);

    memberUserId = memberResponse.body.data.id;

    const memberLoginResponse = await request(app).post("/api/v1/auth/login").send({
      email: "member@example.com",
      password: "password123",
    });

    expect(memberLoginResponse.status).toBe(200);

    memberAccessToken = memberLoginResponse.body.data.accessToken;

    // Create project as owner
    const projectResponse = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${ownerAccessToken}`)
      .send({
        name: "Test Project",
        description: "Project for invitation integration tests",
      });

    expect(projectResponse.status).toBe(201);

    projectId = projectResponse.body.data.id;

    // Add the third user as a MEMBER.
    // This is important because requireProjectRole() first checks
    // whether the user belongs to the project.
    await prisma.projectMember.create({
      data: {
        projectId,
        userId: memberUserId,
        role: "MEMBER",
      },
    });
  });

  afterAll(async () => {
    await cleanDatabase();
    await disconnectDatabase();
  });

  describe("POST /api/v1/projects/:id/invitations", () => {
    it("should create an invitation as the project owner", async () => {
      const response = await request(app)
        .post(`/api/v1/projects/${projectId}/invitations`)
        .set("Authorization", `Bearer ${ownerAccessToken}`)
        .send({
          invitedUserId,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data.projectId).toBe(projectId);
      expect(response.body.data.invitedUserId).toBe(invitedUserId);
      expect(response.body.data.invitedById).toBe(ownerUserId);
      expect(response.body.data.status).toBe("PENDING");

      invitationId = response.body.data.id;
    });

    it("should reject an invitation from a non-owner", async () => {
      const response = await request(app)
        .post(`/api/v1/projects/${projectId}/invitations`)
        .set("Authorization", `Bearer ${memberAccessToken}`)
        .send({
          invitedUserId,
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);

      expect(response.body.error.message).toBe("You are not authorized to perform this action");
    });

    it("should reject inviting a non-existent user", async () => {
      const fakeUserId = "550e8400-e29b-41d4-a716-446655440000";

      const response = await request(app)
        .post(`/api/v1/projects/${projectId}/invitations`)
        .set("Authorization", `Bearer ${ownerAccessToken}`)
        .send({
          invitedUserId: fakeUserId,
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);

      expect(response.body.error.message).toBe("User to invite not found");
    });

    it("should reject inviting the project owner", async () => {
      const response = await request(app)
        .post(`/api/v1/projects/${projectId}/invitations`)
        .set("Authorization", `Bearer ${ownerAccessToken}`)
        .send({
          invitedUserId: ownerUserId,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);

      expect(response.body.error.message).toBe("You cannot invite yourself");
    });

    it("should reject an invalid invitedUserId", async () => {
      const response = await request(app)
        .post(`/api/v1/projects/${projectId}/invitations`)
        .set("Authorization", `Bearer ${ownerAccessToken}`)
        .send({
          invitedUserId: "invalid-user-id",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject a duplicate invitation", async () => {
      await request(app)
        .post(`/api/v1/projects/${projectId}/invitations`)
        .set("Authorization", `Bearer ${ownerAccessToken}`)
        .send({
          invitedUserId,
        });

      const response = await request(app)
        .post(`/api/v1/projects/${projectId}/invitations`)
        .set("Authorization", `Bearer ${ownerAccessToken}`)
        .send({
          invitedUserId,
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);

      expect(response.body.error.message).toBe("Invitation already exists");
    });

    it("should reject inviting an existing project member", async () => {
      const response = await request(app)
        .post(`/api/v1/projects/${projectId}/invitations`)
        .set("Authorization", `Bearer ${ownerAccessToken}`)
        .send({
          invitedUserId: memberUserId,
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);

      expect(response.body.error.message).toBe("User is already a project member");
    });

    it("should reject an unauthenticated request", async () => {
      const response = await request(app).post(`/api/v1/projects/${projectId}/invitations`).send({
        invitedUserId,
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("PATCH /api/v1/projects/invitations/:invitationId/accept", () => {
    beforeEach(async () => {
      const invitation = await prisma.projectInvitation.create({
        data: {
          projectId,
          invitedUserId,
          invitedById: ownerUserId,
        },
      });

      invitationId = invitation.id;
    });

    it("should accept an invitation", async () => {
      const response = await request(app)
        .patch(`/api/v1/projects/invitations/${invitationId}/accept`)
        .set("Authorization", `Bearer ${invitedUserAccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data).toHaveProperty("member");
      expect(response.body.data).toHaveProperty("invitation");

      expect(response.body.data.invitation.status).toBe("ACCEPTED");

      expect(response.body.data.member.userId).toBe(invitedUserId);
      expect(response.body.data.member.projectId).toBe(projectId);
      expect(response.body.data.member.role).toBe("MEMBER");
    });

    it("should reject accepting an invitation as the wrong user", async () => {
      const response = await request(app)
        .patch(`/api/v1/projects/invitations/${invitationId}/accept`)
        .set("Authorization", `Bearer ${memberAccessToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);

      expect(response.body.error.message).toBe("You are not allowed to accept this invitation");
    });

    it("should reject accepting a non-existent invitation", async () => {
      const fakeInvitationId = "550e8400-e29b-41d4-a716-446655440000";

      const response = await request(app)
        .patch(`/api/v1/projects/invitations/${fakeInvitationId}/accept`)
        .set("Authorization", `Bearer ${invitedUserAccessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);

      expect(response.body.error.message).toBe("Invitation not found");
    });

    it("should reject accepting an invitation twice", async () => {
      await request(app)
        .patch(`/api/v1/projects/invitations/${invitationId}/accept`)
        .set("Authorization", `Bearer ${invitedUserAccessToken}`);

      const response = await request(app)
        .patch(`/api/v1/projects/invitations/${invitationId}/accept`)
        .set("Authorization", `Bearer ${invitedUserAccessToken}`);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);

      expect(response.body.error.message).toBe("Invitation is no longer pending");
    });

    it("should reject an unauthenticated request", async () => {
      const response = await request(app).patch(
        `/api/v1/projects/invitations/${invitationId}/accept`
      );

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("PATCH /api/v1/projects/invitations/:invitationId/reject", () => {
    beforeEach(async () => {
      const invitation = await prisma.projectInvitation.create({
        data: {
          projectId,
          invitedUserId,
          invitedById: ownerUserId,
        },
      });

      invitationId = invitation.id;
    });

    it("should reject an invitation", async () => {
      const response = await request(app)
        .patch(`/api/v1/projects/invitations/${invitationId}/reject`)
        .set("Authorization", `Bearer ${invitedUserAccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data.status).toBe("REJECTED");
    });

    it("should reject rejecting an invitation as the wrong user", async () => {
      const response = await request(app)
        .patch(`/api/v1/projects/invitations/${invitationId}/reject`)
        .set("Authorization", `Bearer ${memberAccessToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);

      expect(response.body.error.message).toBe("You are not allowed to reject this invitation");
    });

    it("should reject rejecting a non-existent invitation", async () => {
      const fakeInvitationId = "550e8400-e29b-41d4-a716-446655440000";

      const response = await request(app)
        .patch(`/api/v1/projects/invitations/${fakeInvitationId}/reject`)
        .set("Authorization", `Bearer ${invitedUserAccessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);

      expect(response.body.error.message).toBe("Invitation not found");
    });

    it("should reject rejecting an invitation twice", async () => {
      await request(app)
        .patch(`/api/v1/projects/invitations/${invitationId}/reject`)
        .set("Authorization", `Bearer ${invitedUserAccessToken}`);

      const response = await request(app)
        .patch(`/api/v1/projects/invitations/${invitationId}/reject`)
        .set("Authorization", `Bearer ${invitedUserAccessToken}`);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);

      expect(response.body.error.message).toBe("Invitation is no longer pending");
    });

    it("should reject an unauthenticated request", async () => {
      const response = await request(app).patch(
        `/api/v1/projects/invitations/${invitationId}/reject`
      );

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
