import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, packages, keys, devices, sessions, dylibVersions } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId && !user.username) {
    throw new Error("User openId or username is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
      username: user.username,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "passwordHash", "profileImage"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    }
    if (user.vipLevel !== undefined) {
      values.vipLevel = user.vipLevel;
      updateSet.vipLevel = user.vipLevel;
    }
    if (user.language !== undefined) {
      values.language = user.language;
      updateSet.language = user.language;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Package helpers
export async function getPackagesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(packages).where(eq(packages.userId, userId));
}

export async function getPackageById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(packages).where(eq(packages.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPackageByToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(packages).where(eq(packages.token, token)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Key helpers
export async function getKeysByPackageId(packageId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(keys).where(eq(keys.packageId, packageId)).orderBy(desc(keys.createdAt));
}

export async function getKeyByCode(keyCode: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(keys).where(eq(keys.keyCode, keyCode)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Device helpers
export async function getDeviceByUDID(udid: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(devices).where(eq(devices.udid, udid)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getDevicesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(devices).where(eq(devices.userId, userId));
}

// Session helpers
export async function getSessionByToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(sessions).where(eq(sessions.sessionToken, token)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getSessionsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(sessions).where(eq(sessions.userId, userId));
}

// Dylib helpers
export async function getDylibVersionsByPackageId(packageId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(dylibVersions).where(eq(dylibVersions.packageId, packageId)).orderBy(desc(dylibVersions.createdAt));
}
