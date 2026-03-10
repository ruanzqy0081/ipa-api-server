import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { authRouter } from "./routers/auth";
import { packagesRouter } from "./routers/packages";
import { keysRouter } from "./routers/keys";
import { devicesRouter } from "./routers/devices";
import { dylibRouter } from "./routers/dylib";

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  packages: packagesRouter,
  keys: keysRouter,
  devices: devicesRouter,
  dylib: dylibRouter,
});

export type AppRouter = typeof appRouter;

// Legacy auth endpoints for backward compatibility
export const legacyAuthRouter = router({
  me: publicProcedure.query(opts => opts.ctx.user),
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return {
      success: true,
    } as const;
  }),
});

export type LegacyAuthRouter = typeof legacyAuthRouter;
