import prisma from "../../../src/config/prisma";
import { getCurrentUser, updateCurrentUser } from "../../../src/modules/users/users.service";
import { AppError } from "../../../src/utils/appError";

jest.mock("../../../src/config/prisma", () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe("Users Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getCurrentUser", () => {
    it("should return the current user when user exists", async () => {
      const userId = "user-123";

      const mockUser = {
        id: userId,
        name: "John Doe",
        email: "john@example.com",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await getCurrentUser(userId);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: userId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      expect(result).toEqual(mockUser);
    });

    it("should throw 404 when user does not exist", async () => {
      const userId = "user-123";

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(getCurrentUser(userId)).rejects.toEqual(new AppError("User not found", 404));

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: userId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });
  });

  describe("updateCurrentUser", () => {
    it("should update the user's name and return the updated user", async () => {
      const userId = "user-123";

      const updateData = {
        name: "Updated Name",
      };

      const mockUpdatedUser = {
        id: userId,
        name: "Updated Name",
        email: "john@example.com",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.update as jest.Mock).mockResolvedValue(mockUpdatedUser);

      const result = await updateCurrentUser(userId, updateData);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: {
          id: userId,
        },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      expect(result).toEqual(mockUpdatedUser);
    });

    it("should allow an empty update object", async () => {
      const userId = "user-123";

      const mockUser = {
        id: userId,
        name: "John Doe",
        email: "john@example.com",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);

      const result = await updateCurrentUser(userId, {});

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: {
          id: userId,
        },
        data: {},
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      expect(result).toEqual(mockUser);
    });

    it("should propagate Prisma errors", async () => {
      const userId = "user-123";
      const databaseError = new Error("Database error");

      (prisma.user.update as jest.Mock).mockRejectedValue(databaseError);

      await expect(updateCurrentUser(userId, { name: "Updated Name" })).rejects.toThrow(
        "Database error"
      );
    });
  });
});
