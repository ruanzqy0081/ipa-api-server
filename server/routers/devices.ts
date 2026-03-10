import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { devices, sessions } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";

export const devicesRouter = router({
  // List devices for current user
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const userDevices = await db
      .select()
      .from(devices)
      .where(eq(devices.userId, ctx.user.id))
      .orderBy(desc(devices.lastSeen));

    return userDevices;
  }),

  // Register or update UDID
  registerUDID: publicProcedure
    .input(z.object({
      udid: z.string(),
      deviceName: z.string().optional(),
      packageToken: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      let device = await db
        .select()
        .from(devices)
        .where(eq(devices.udid, input.udid))
        .limit(1);

      if (device[0]) {
        // Update existing device
        await db
          .update(devices)
          .set({
            deviceName: input.deviceName || device[0].deviceName,
            lastSeen: new Date(),
            status: "online",
          })
          .where(eq(devices.udid, input.udid));
      } else {
        // Create new device
        await db.insert(devices).values({
          udid: input.udid,
          deviceName: input.deviceName,
          status: "online",
          lastSeen: new Date(),
        });
      }

      const updated = await db
        .select()
        .from(devices)
        .where(eq(devices.udid, input.udid))
        .limit(1);

      return updated[0];
    }),

  // Get device by UDID
  getByUDID: publicProcedure
    .input(z.object({
      udid: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const device = await db
        .select()
        .from(devices)
        .where(eq(devices.udid, input.udid))
        .limit(1);

      return device[0];
    }),

  // Update device status
  updateStatus: protectedProcedure
    .input(z.object({
      deviceId: z.number(),
      status: z.enum(["online", "offline"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const device = await db
        .select()
        .from(devices)
        .where(and(eq(devices.id, input.deviceId), eq(devices.userId, ctx.user.id)))
        .limit(1);

      if (!device[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Device not found" });
      }

      await db
        .update(devices)
        .set({ status: input.status, lastSeen: new Date() })
        .where(eq(devices.id, input.deviceId));

      const updated = await db.select().from(devices).where(eq(devices.id, input.deviceId)).limit(1);
      return updated[0];
    }),

  // Get sessions for device
  getSessions: protectedProcedure
    .input(z.object({
      deviceId: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const device = await db
        .select()
        .from(devices)
        .where(and(eq(devices.id, input.deviceId), eq(devices.userId, ctx.user.id)))
        .limit(1);

      if (!device[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Device not found" });
      }

      const deviceSessions = await db
        .select()
        .from(sessions)
        .where(eq(sessions.deviceId, input.deviceId))
        .orderBy(desc(sessions.createdAt));

      return deviceSessions;
    }),

  // List all sessions for current user
  listSessions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const userSessions = await db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, ctx.user.id))
      .orderBy(desc(sessions.createdAt));

    return userSessions;
  }),

  // Clear all sessions (logout from all devices)
  clearAllSessions: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    await db.delete(sessions).where(eq(sessions.userId, ctx.user.id));

    return { success: true };
  }),

  // Delete session
  deleteSession: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const session = await db
        .select()
        .from(sessions)
        .where(and(eq(sessions.id, input.sessionId), eq(sessions.userId, ctx.user.id)))
        .limit(1);

      if (!session[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
      }

      await db.delete(sessions).where(eq(sessions.id, input.sessionId));

      return { success: true };
    }),

  // Create session
  createSession: publicProcedure
    .input(z.object({
      userId: z.number(),
      deviceId: z.number().optional(),
      ipAddress: z.string().optional(),
      userAgent: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const sessionToken = nanoid(32);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

      await db.insert(sessions).values({
        userId: input.userId,
        deviceId: input.deviceId,
        sessionToken,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        expiresAt,
      });

      const newSession = await db
        .select()
        .from(sessions)
        .where(eq(sessions.sessionToken, sessionToken))
        .limit(1);

      return newSession[0];
    }),
});
