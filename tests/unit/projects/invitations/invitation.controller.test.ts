import { Response, NextFunction } from "express";

import { AuthenticatedRequest } from "../../../../src/middleware/auth.middleware";

import {
  createInvitation,
  acceptInvitation,
  rejectInvitation,
} from "../../../../src/modules/projects/invitations/invitation.service";

import {
  createInvitationController,
  acceptInvitationController,
  rejectInvitationController,
} from "../../../../src/modules/projects/invitations/invitation.controller";

jest.mock("../../../../src/modules/projects/invitations/invitation.service", () => ({
  createInvitation: jest.fn(),
  acceptInvitation: jest.fn(),
  rejectInvitation: jest.fn(),
}));

const mockedCreateInvitation = createInvitation as jest.MockedFunction<typeof createInvitation>;

const mockedAcceptInvitation = acceptInvitation as jest.MockedFunction<typeof acceptInvitation>;

const mockedRejectInvitation = rejectInvitation as jest.MockedFunction<typeof rejectInvitation>;

const createResponseMock = (): Response => {
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

describe("Invitation Controllers", () => {
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    res = createResponseMock();
    next = jest.fn();
  });

  describe("createInvitationController", () => {
    it("should create an invitation and return 201", async () => {
      const projectId = "22222222-2222-4222-8222-222222222222";
      const invitedUserId = "33333333-3333-4333-8333-333333333333";

      const req = createRequestMock({
        params: {
          id: projectId,
        },
        body: {
          invitedUserId,
        },
      });

      const invitation = {
        id: "44444444-4444-4444-8444-444444444444",
        projectId,
        invitedUserId,
        invitedById: req.userId,
        status: "PENDING",
      };

      mockedCreateInvitation.mockResolvedValue(invitation as never);

      await createInvitationController(req, res, next);

      expect(mockedCreateInvitation).toHaveBeenCalledWith(projectId, req.userId, req.body);

      expect(res.status).toHaveBeenCalledWith(201);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: invitation,
      });

      expect(next).not.toHaveBeenCalled();
    });

    it("should pass service errors to next", async () => {
      const error = new Error("Only the project owner can invite users");

      const req = createRequestMock({
        params: {
          id: "22222222-2222-4222-8222-222222222222",
        },
        body: {
          invitedUserId: "33333333-3333-4333-8333-333333333333",
        },
      });

      mockedCreateInvitation.mockRejectedValue(error);

      await createInvitationController(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("acceptInvitationController", () => {
    it("should accept an invitation and return 200", async () => {
      const invitationId = "44444444-4444-4444-8444-444444444444";

      const req = createRequestMock({
        params: {
          invitationId,
        },
      });

      const result = {
        member: {
          id: "55555555-5555-4555-8555-555555555555",
          projectId: "22222222-2222-4222-8222-222222222222",
          userId: req.userId,
          role: "MEMBER",
        },
        invitation: {
          id: invitationId,
          status: "ACCEPTED",
        },
      };

      mockedAcceptInvitation.mockResolvedValue(result as never);

      await acceptInvitationController(req, res, next);

      expect(mockedAcceptInvitation).toHaveBeenCalledWith(invitationId, req.userId);

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: result,
      });

      expect(next).not.toHaveBeenCalled();
    });

    it("should pass service errors to next", async () => {
      const error = new Error("Invitation is no longer pending");

      const req = createRequestMock({
        params: {
          invitationId: "44444444-4444-4444-8444-444444444444",
        },
      });

      mockedAcceptInvitation.mockRejectedValue(error);

      await acceptInvitationController(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("rejectInvitationController", () => {
    it("should reject an invitation and return 200", async () => {
      const invitationId = "44444444-4444-4444-8444-444444444444";

      const req = createRequestMock({
        params: {
          invitationId,
        },
      });

      const invitation = {
        id: invitationId,
        projectId: "22222222-2222-4222-8222-222222222222",
        invitedUserId: req.userId,
        status: "REJECTED",
      };

      mockedRejectInvitation.mockResolvedValue(invitation as never);

      await rejectInvitationController(req, res, next);

      expect(mockedRejectInvitation).toHaveBeenCalledWith(invitationId, req.userId);

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: invitation,
      });

      expect(next).not.toHaveBeenCalled();
    });

    it("should pass service errors to next", async () => {
      const error = new Error("Invitation is no longer pending");

      const req = createRequestMock({
        params: {
          invitationId: "44444444-4444-4444-8444-444444444444",
        },
      });

      mockedRejectInvitation.mockRejectedValue(error);

      await rejectInvitationController(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
