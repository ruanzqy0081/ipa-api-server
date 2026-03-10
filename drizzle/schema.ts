import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  username: varchar("username", { length: 64 }).unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  vipLevel: mysqlEnum("vipLevel", ["free", "vip1", "vip2", "vip3", "vip4"]).default("free").notNull(),
  language: mysqlEnum("language", ["pt-BR", "en"]).default("pt-BR").notNull(),
  profileImage: text("profileImage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Packages table
export const packages = mysqlTable("packages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  status: mysqlEnum("status", ["active", "paused", "maintenance", "locked"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("packages_userId_idx").on(table.userId),
}));

export type Package = typeof packages.$inferSelect;
export type InsertPackage = typeof packages.$inferInsert;

// Keys table
export const keys = mysqlTable("keys", {
  id: int("id").autoincrement().primaryKey(),
  packageId: int("packageId").notNull(),
  userId: int("userId").notNull(),
  keyCode: varchar("keyCode", { length: 255 }).notNull().unique(),
  alias: varchar("alias", { length: 64 }),
  duration: mysqlEnum("duration", ["1day", "1week", "1month", "1year"]).notNull(),
  status: mysqlEnum("status", ["active", "paused", "banned", "expired"]).default("active").notNull(),
  activatedAt: timestamp("activatedAt"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  packageIdIdx: index("keys_packageId_idx").on(table.packageId),
  userIdIdx: index("keys_userId_idx").on(table.userId),
}));

export type Key = typeof keys.$inferSelect;
export type InsertKey = typeof keys.$inferInsert;

// Devices/UDID table
export const devices = mysqlTable("devices", {
  id: int("id").autoincrement().primaryKey(),
  udid: varchar("udid", { length: 255 }).notNull().unique(),
  userId: int("userId"),
  packageId: int("packageId"),
  deviceName: varchar("deviceName", { length: 255 }),
  status: mysqlEnum("status", ["online", "offline"]).default("offline").notNull(),
  lastSeen: timestamp("lastSeen").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  udidIdx: index("devices_udid_idx").on(table.udid),
  userIdIdx: index("devices_userId_idx").on(table.userId),
  packageIdIdx: index("devices_packageId_idx").on(table.packageId),
}));

export type Device = typeof devices.$inferSelect;
export type InsertDevice = typeof devices.$inferInsert;

// Sessions table
export const sessions = mysqlTable("sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  deviceId: int("deviceId"),
  sessionToken: varchar("sessionToken", { length: 255 }).notNull().unique(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("sessions_userId_idx").on(table.userId),
  sessionTokenIdx: index("sessions_sessionToken_idx").on(table.sessionToken),
}));

export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;

// Dylib versions table
export const dylibVersions = mysqlTable("dylibVersions", {
  id: int("id").autoincrement().primaryKey(),
  packageId: int("packageId").notNull(),
  version: varchar("version", { length: 64 }).notNull(),
  s3Key: varchar("s3Key", { length: 255 }).notNull(),
  s3Url: text("s3Url").notNull(),
  fileSize: int("fileSize"),
  checksum: varchar("checksum", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  packageIdIdx: index("dylibVersions_packageId_idx").on(table.packageId),
}));

export type DylibVersion = typeof dylibVersions.$inferSelect;
export type InsertDylibVersion = typeof dylibVersions.$inferInsert;
