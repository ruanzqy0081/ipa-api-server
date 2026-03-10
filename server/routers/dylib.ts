import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { packages, dylibVersions } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { storagePut } from "../storage";
import crypto from "crypto";

export const dylibRouter = router({
  // List dylib versions for a package
  listVersions: protectedProcedure
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

      const versions = await db
        .select()
        .from(dylibVersions)
        .where(eq(dylibVersions.packageId, input.packageId))
        .orderBy(desc(dylibVersions.createdAt));

      return versions;
    }),

  // Generate dylib
  generate: protectedProcedure
    .input(z.object({
      packageId: z.number(),
      version: z.string().optional(),
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

      // Generate simulated dylib content with embedded token
      const dylibContent = generateDylibContent(pkg[0].token, pkg[0].name);
      const checksum = crypto.createHash("sha256").update(dylibContent).digest("hex");
      const version = input.version || new Date().toISOString().split("T")[0];
      const s3Key = `dylib/${pkg[0].id}/${version}/api-server.dylib`;

      try {
        // Upload to S3
        const { url } = await storagePut(s3Key, Buffer.from(dylibContent), "application/octet-stream");

        // Save to database
        await db.insert(dylibVersions).values({
          packageId: input.packageId,
          version,
          s3Key,
          s3Url: url,
          fileSize: dylibContent.length,
          checksum,
        });

        const newVersion = await db
          .select()
          .from(dylibVersions)
          .where(and(eq(dylibVersions.packageId, input.packageId), eq(dylibVersions.version, version)))
          .limit(1);

        return newVersion[0];
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to generate dylib",
        });
      }
    }),

  // Get download URL for dylib
  getDownloadUrl: protectedProcedure
    .input(z.object({
      versionId: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const version = await db
        .select()
        .from(dylibVersions)
        .where(eq(dylibVersions.id, input.versionId))
        .limit(1);

      if (!version[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Dylib version not found" });
      }

      // Verify user owns the package
      const pkg = await db
        .select()
        .from(packages)
        .where(and(eq(packages.id, version[0].packageId), eq(packages.userId, ctx.user.id)))
        .limit(1);

      if (!pkg[0]) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      return {
        url: version[0].s3Url,
        version: version[0].version,
        checksum: version[0].checksum,
        fileSize: version[0].fileSize,
      };
    }),

  // Delete dylib version
  deleteVersion: protectedProcedure
    .input(z.object({
      versionId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const version = await db
        .select()
        .from(dylibVersions)
        .where(eq(dylibVersions.id, input.versionId))
        .limit(1);

      if (!version[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Dylib version not found" });
      }

      // Verify user owns the package
      const pkg = await db
        .select()
        .from(packages)
        .where(and(eq(packages.id, version[0].packageId), eq(packages.userId, ctx.user.id)))
        .limit(1);

      if (!pkg[0]) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      await db.delete(dylibVersions).where(eq(dylibVersions.id, input.versionId));

      return { success: true };
    }),
});

// Generate simulated dylib content with embedded token
function generateDylibContent(token: string, packageName: string): string {
  // This is a simulated dylib template
  // In production, this would be actual binary content
  const content = `
// iPA API Server Dylib
// Package: ${packageName}
// Token: ${token}
// Generated: ${new Date().toISOString()}

#include <stdio.h>
#include <string.h>

// Embedded package token
const char* PACKAGE_TOKEN = "${token}";
const char* PACKAGE_NAME = "${packageName}";

// API Server endpoint
const char* API_SERVER_ENDPOINT = "https://api.ipaserver.local";

// Initialize dylib
void init_api_server() {
    printf("iPA API Server initialized\\n");
    printf("Package: %s\\n", PACKAGE_NAME);
    printf("Token: %s\\n", PACKAGE_TOKEN);
}

// Validate key
int validate_key(const char* key_code) {
    // Validation logic would go here
    return 1;
}

// Get device UDID
const char* get_device_udid() {
    // UDID retrieval logic would go here
    return "simulated-udid";
}
`;

  return content;
}
