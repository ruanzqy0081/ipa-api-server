import { describe, it, expect, beforeAll } from "vitest";
import { authenticateAdmin, createUser, generateKeyCode, getVIPLimits } from "./auth";

describe("Auth Module", () => {
  describe("Admin Authentication", () => {
    it("should authenticate admin with correct credentials", async () => {
      const user = await authenticateAdmin("admin", "admin123");
      expect(user).toBeDefined();
      expect(user?.role).toBe("admin");
    });

    it("should fail with incorrect password", async () => {
      const user = await authenticateAdmin("admin", "wrongpassword");
      expect(user).toBeNull();
    });

    it("should fail with non-existent user", async () => {
      const user = await authenticateAdmin("nonexistent", "password");
      expect(user).toBeNull();
    });
  });

  describe("VIP Limits", () => {
    it("should return correct limits for VIP1", () => {
      const limits = getVIPLimits("vip1");
      expect(limits.maxKeys).toBe(200);
      expect(limits.maxPackages).toBe(3);
    });

    it("should return correct limits for VIP2", () => {
      const limits = getVIPLimits("vip2");
      expect(limits.maxKeys).toBe(500);
      expect(limits.maxPackages).toBe(3);
    });

    it("should return correct limits for VIP3", () => {
      const limits = getVIPLimits("vip3");
      expect(limits.maxKeys).toBe(1000);
      expect(limits.maxPackages).toBe(3);
    });

    it("should return correct limits for VIP4", () => {
      const limits = getVIPLimits("vip4");
      expect(limits.maxKeys).toBe(10000);
      expect(limits.dailyLimit).toBe(10000);
    });

    it("should return default limits for free users", () => {
      const limits = getVIPLimits("free");
      expect(limits.maxKeys).toBe(50);
      expect(limits.maxPackages).toBe(1);
    });
  });

  describe("Key Code Generation", () => {
    it("should generate key code without alias", () => {
      const code = generateKeyCode();
      expect(code).toMatch(/^apiserver-/);
    });

    it("should generate key code with alias and duration", () => {
      const code = generateKeyCode("FFH4X", "1month");
      expect(code).toMatch(/^FFH4X-1month-/);
    });

    it("should generate unique codes", () => {
      const code1 = generateKeyCode();
      const code2 = generateKeyCode();
      expect(code1).not.toBe(code2);
    });
  });
});
