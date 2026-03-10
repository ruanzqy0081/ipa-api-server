import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { generateToken, getVIPLimits } from "../auth";
import { getDb } from "../db";
import { packages, keys } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const packagesRouter = router({
  // List packages for current user
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const userPackages = await db
      .select()
      .from(packages)
      .where(eq(packages.userId, ctx.user.id))
      .orderBy(desc(packages.createdAt));

    return userPackages;
  }),

  // Create package
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Check package limit based on VIP level
      const limits = getVIPLimits(ctx.user.vipLevel);
      const userPackages = await db
        .select()
        .from(packages)
        .where(eq(packages.userId, ctx.user.id));

      if (userPackages.length >= limits.maxPackages) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `You can only create ${limits.maxPackages} packages. Delete one to create another.`,
        });
      }

      const token = generateToken(32);
      const result = await db.insert(packages).values({
        userId: ctx.user.id,
        name: input.name,
        token,
        status: "active",
      });

      const newPackage = await db
        .select()
        .from(packages)
        .where(eq(packages.token, token))
        .limit(1);

      return newPackage[0];
    }),

  // Update package
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(255).optional(),
      status: z.enum(["active", "paused", "maintenance", "locked"]).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const pkg = await db
        .select()
        .from(packages)
        .where(and(eq(packages.id, input.id), eq(packages.userId, ctx.user.id)))
        .limit(1);

      if (!pkg[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Package not found" });
      }

      const updateData: Record<string, unknown> = {};
      if (input.name) updateData.name = input.name;
      if (input.status) updateData.status = input.status;

      await db.update(packages).set(updateData).where(eq(packages.id, input.id));

      const updated = await db.select().from(packages).where(eq(packages.id, input.id)).limit(1);
      return updated[0];
    }),

  // Delete package
  delete: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const pkg = await db
        .select()
        .from(packages)
        .where(and(eq(packages.id, input.id), eq(packages.userId, ctx.user.id)))
        .limit(1);

      if (!pkg[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Package not found" });
      }

      // Delete associated keys first
      await db.delete(keys).where(eq(keys.packageId, input.id));

      // Delete package
      await db.delete(packages).where(eq(packages.id, input.id));

      return { success: true };
    }),

  // Get package details
  get: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const pkg = await db
        .select()
        .from(packages)
        .where(and(eq(packages.id, input.id), eq(packages.userId, ctx.user.id)))
        .limit(1);

      if (!pkg[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Package not found" });
      }

      return pkg[0];
    }),
});
