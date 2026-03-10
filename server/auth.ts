import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import { getUserByUsername, getUserById, upsertUser, getDb } from './db';
import { users } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';
const SALT_ROUNDS = 10;

// Initialize admin user on first run
export async function initializeAdminUser() {
  const adminUser = await getUserByUsername(ADMIN_USERNAME);
  if (!adminUser) {
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);
    await upsertUser({
      username: ADMIN_USERNAME,
      passwordHash: hashedPassword,
      name: 'Admin',
      email: 'admin@ipaserver.local',
      role: 'admin',
      vipLevel: 'vip4',
      language: 'pt-BR',
      lastSignedIn: new Date(),
    });
    console.log('[Auth] Admin user initialized');
  }
}

export async function authenticateAdmin(username: string, password: string) {
  const user = await getUserByUsername(username);
  if (!user || !user.passwordHash) {
    return null;
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    return null;
  }

  if (user.role !== 'admin') {
    return null;
  }

  return user;
}

export async function authenticateUser(username: string, password: string) {
  const user = await getUserByUsername(username);
  if (!user || !user.passwordHash) {
    return null;
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    return null;
  }

  return user;
}

export async function createUser(username: string, password: string, email: string, name: string) {
  const existingUser = await getUserByUsername(username);
  if (existingUser) {
    throw new Error('Username already exists');
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const newUser = {
    username,
    passwordHash: hashedPassword,
    email,
    name,
    role: 'user' as const,
    vipLevel: 'free' as const,
    language: 'pt-BR' as const,
    lastSignedIn: new Date(),
  };

  await upsertUser(newUser);
  return getUserByUsername(username);
}

export async function updateUserPassword(userId: number, newPassword: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await db.update(users).set({ passwordHash: hashedPassword }).where(eq(users.id, userId));
}

export async function updateUserVIPLevel(userId: number, vipLevel: 'free' | 'vip1' | 'vip2' | 'vip3' | 'vip4') {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db.update(users).set({ vipLevel }).where(eq(users.id, userId));
}

export async function updateUserLanguage(userId: number, language: 'pt-BR' | 'en') {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db.update(users).set({ language }).where(eq(users.id, userId));
}

export function getVIPLimits(vipLevel: string) {
  switch (vipLevel) {
    case 'vip1':
      return { maxKeys: 200, maxPackages: 3 };
    case 'vip2':
      return { maxKeys: 500, maxPackages: 3 };
    case 'vip3':
      return { maxKeys: 1000, maxPackages: 3 };
    case 'vip4':
      return { maxKeys: 10000, maxPackages: 3, dailyLimit: 10000 };
    default:
      return { maxKeys: 50, maxPackages: 1 };
  }
}

export function generateToken(length = 32) {
  return nanoid(length);
}

export function generateKeyCode(alias?: string, duration?: string) {
  const code = nanoid(8);
  if (alias && duration) {
    return `${alias}-${duration}-${code}`;
  }
  return `apiserver-${code}`;
}
