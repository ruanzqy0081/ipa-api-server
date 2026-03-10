import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { generateKeyCode, getVIPLimits } from "../auth";
import { getDb } from "../db";
import { keys, packages } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const keysRouter = router({
  // List keys for a package
  listByPackage: protectedProcedure
    .input(z.object({
      packageId: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify package belongs to user
      const pkg = await db
        .select()
        .from(packages)
        .where(and(eq(packages.id, input.packageId), eq(packages.userId, ctx.user.id)))
        .limit(1);

      if (!pkg[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Package not found" });
      }

      const packageKeys = await db
        .select()
        .from(keys)
        .where(eq(keys.packageId, input.packageId))
        .orderBy(desc(keys.createdAt));

      return packageKeys;
    }),

  // Create key
  create: protectedProcedure
    .input(z.object({
      packageId: z.number(),
      duration: z.enum(["1day", "1week", "1month", "1year"]),
      alias: z.string().max(64).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify package belongs to user
      const pkg = await db
        .select()
        .from(packages)
        .where(and(eq(packages.id, input.packageId), eq(packages.userId, ctx.user.id)))
        .limit(1);

      if (!pkg[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Package not found" });
      }

      // Check key limit based on VIP level
      const limits = getVIPLimits(ctx.user.vipLevel);
      const userKeys = await db.select().from(keys).where(eq(keys.userId, ctx.user.id));

      if (userKeys.length >= limits.maxKeys) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `You have reached your key limit (${limits.maxKeys})`,
        });
      }

      // Generate key code
      const keyCode = generateKeyCode(input.alias, input.duration);

      // Calculate expiration date (but don't set it yet - only when activated)
      const result = await db.insert(keys).values({
        packageId: input.packageId,
        userId: ctx.user.id,
        keyCode,
        alias: input.alias,
        duration: input.duration,
        status: "active",
      });

      const newKey = await db
        .select()
        .from(keys)
        .where(eq(keys.keyCode, keyCode))
        .limit(1);

      return newKey[0];
    }),

  // Activate key
  activate: protectedProcedure
    .input(z.object({
      keyId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const key = await db
        .select()
        .from(keys)
        .where(and(eq(keys.id, input.keyId), eq(keys.userId, ctx.user.id)))
        .limit(1);

      if (!key[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Key not found" });
      }

      if (key[0].activatedAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Key already activated" });
      }

      const now = new Date();
      let expiresAt = new Date(now);

      switch (key[0].duration) {
        case "1day":
          expiresAt.setDate(expiresAt.getDate() + 1);
          break;
        case "1week":
          expiresAt.setDate(expiresAt.getDate() + 7);
          break;
        case "1month":
          expiresAt.setMonth(expiresAt.getMonth() + 1);
          break;
        case "1year":
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);
          break;
      }

      await db
        .update(keys)
        .set({ activatedAt: now, expiresAt, status: "active" })
        .where(eq(keys.id, input.keyId));

      const updated = await db.select().from(keys).where(eq(keys.id, input.keyId)).limit(1);
      return updated[0];
    }),

  // Pause key
  pause: protectedProcedure
    .input(z.object({
      keyId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const key = await db
        .select()
        .from(keys)
        .where(and(eq(keys.id, input.keyId), eq(keys.userId, ctx.user.id)))
        .limit(1);

      if (!key[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Key not found" });
      }

      await db.update(keys).set({ status: "paused" }).where(eq(keys.id, input.keyId));

      const updated = await db.select().from(keys).where(eq(keys.id, input.keyId)).limit(1);
      return updated[0];
    }),

  // Reset key
  reset: protectedProcedure
    .input(z.object({
      keyId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const key = await db
        .select()
        .from(keys)
        .where(and(eq(keys.id, input.keyId), eq(keys.userId, ctx.user.id)))
        .limit(1);

      if (!key[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Key not found" });
      }

      await db
        .update(keys)
        .set({ activatedAt: null, expiresAt: null, status: "active" })
        .where(eq(keys.id, input.keyId));

      const updated = await db.select().from(keys).where(eq(keys.id, input.keyId)).limit(1);
      return updated[0];
    }),

  // Ban key
  ban: protectedProcedure
    .input(z.object({
      keyId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const key = await db
        .select()
        .from(keys)
        .where(and(eq(keys.id, input.keyId), eq(keys.userId, ctx.user.id)))
        .limit(1);

      if (!key[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Key not found" });
      }

      await db.update(keys).set({ status: "banned" }).where(eq(keys.id, input.keyId));

      const updated = await db.select().from(keys).where(eq(keys.id, input.keyId)).limit(1);
      return updated[0];
    }),

  // Delete key
  delete: protectedProcedure
    .input(z.object({
      keyId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const key = await db
        .select()
        .from(keys)
        .where(and(eq(keys.id, input.keyId), eq(keys.userId, ctx.user.id)))
        .limit(1);

      if (!key[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Key not found" });
      }

      await db.delete(keys).where(eq(keys.id, input.keyId));

      return { success: true };
    }),

  // Add time to key
  addTime: protectedProcedure
    .input(z.object({
      keyId: z.number(),
      duration: z.enum(["1day", "1week", "1month", "1year"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const key = await db
        .select()
        .from(keys)
        .where(and(eq(keys.id, input.keyId), eq(keys.userId, ctx.user.id)))
        .limit(1);

      if (!key[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Key not found" });
      }

      if (!key[0].expiresAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Key not activated" });
      }

      let newExpiresAt = new Date(key[0].expiresAt);

      switch (input.duration) {
        case "1day":
          newExpiresAt.setDate(newExpiresAt.getDate() + 1);
          break;
        case "1week":
          newExpiresAt.setDate(newExpiresAt.getDate() + 7);
          break;
        case "1month":
          newExpiresAt.setMonth(newExpiresAt.getMonth() + 1);
          break;
        case "1year":
          newExpiresAt.setFullYear(newExpiresAt.getFullYear() + 1);
          break;
      }

      await db.update(keys).set({ expiresAt: newExpiresAt }).where(eq(keys.id, input.keyId));

      const updated = await db.select().from(keys).where(eq(keys.id, input.keyId)).limit(1);
      return updated[0];
    }),

  // Validate key (public endpoint for IPA)
  validate: publicProcedure
    .input(z.object({
      keyCode: z.string(),
      packageToken: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const key = await db
        .select()
        .from(keys)
        .where(eq(keys.keyCode, input.keyCode))
        .limit(1);

      if (!key[0]) {
        return { valid: false, message: "Key not found" };
      }

      // Verify package token matches
      const pkg = await db
        .select()
        .from(packages)
        .where(eq(packages.id, key[0].packageId))
        .limit(1);

      if (!pkg[0] || pkg[0].token !== input.packageToken) {
        return { valid: false, message: "Invalid package" };
      }

      // Check if package is in maintenance
      if (pkg[0].status === "maintenance") {
        return { valid: false, message: "API Server em atualização" };
      }

      if (pkg[0].status === "locked" || pkg[0].status === "paused") {
        return { valid: false, message: "Package is not available" };
      }

      // Check key status
      if (key[0].status === "banned") {
        return { valid: false, message: "Key is banned" };
      }

      if (key[0].status === "paused") {
        return { valid: false, message: "Key is paused" };
      }

      if (!key[0].activatedAt) {
        return { valid: false, message: "Key not activated" };
      }

      if (key[0].expiresAt && new Date() > key[0].expiresAt) {
        return { valid: false, message: "Key expired" };
      }

      return {
        valid: true,
        activatedAt: key[0].activatedAt,
        expiresAt: key[0].expiresAt,
        packageName: pkg[0].name,
      };
    }),
});
