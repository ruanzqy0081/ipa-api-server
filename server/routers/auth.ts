import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { authenticateAdmin, authenticateUser, createUser, updateUserPassword, updateUserLanguage, initializeAdminUser } from "../auth";
import { getUserById } from "../db";
import { TRPCError } from "@trpc/server";

// Initialize admin user on startup
initializeAdminUser().catch(console.error);

export const authRouter = router({
  // Admin login
  adminLogin: publicProcedure
    .input(z.object({
      username: z.string(),
      password: z.string(),
    }))
    .mutation(async ({ input }) => {
      const user = await authenticateAdmin(input.username, input.password);
      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }
      return {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        vipLevel: user.vipLevel,
        language: user.language,
      };
    }),

  // User login
  userLogin: publicProcedure
    .input(z.object({
      username: z.string(),
      password: z.string(),
    }))
    .mutation(async ({ input }) => {
      const user = await authenticateUser(input.username, input.password);
      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }
      return {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        vipLevel: user.vipLevel,
        language: user.language,
      };
    }),

  // Get current user
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await getUserById(ctx.user.id);
    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      vipLevel: user.vipLevel,
      language: user.language,
      profileImage: user.profileImage,
    };
  }),

  // Update language
  updateLanguage: protectedProcedure
    .input(z.object({
      language: z.enum(["pt-BR", "en"]),
    }))
    .mutation(async ({ input, ctx }) => {
      await updateUserLanguage(ctx.user.id, input.language);
      return { success: true };
    }),

  // Change password
  changePassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(6),
    }))
    .mutation(async ({ input, ctx }) => {
      const user = await getUserById(ctx.user.id);
      if (!user || !user.passwordHash || !user.username) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const authenticated = await authenticateUser(user.username, input.currentPassword);
      if (!authenticated) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Current password is incorrect",
        });
      }

      await updateUserPassword(ctx.user.id, input.newPassword);
      return { success: true };
    }),

  // Admin: Create user
  createUser: protectedProcedure
    .input(z.object({
      username: z.string(),
      password: z.string().min(6),
      email: z.string().email(),
      name: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can create users",
        });
      }

      try {
        const user = await createUser(input.username, input.password, input.email, input.name);
        return {
          id: user?.id,
          username: user?.username,
          name: user?.name,
          email: user?.email,
        };
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Failed to create user",
        });
      }
    }),
});
