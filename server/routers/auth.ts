import { COOKIE_NAME } from "../../shared/const.js";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod/v4";
import { getSessionCookieOptions } from "../_core/cookies.js";
import { sdk } from "../_core/sdk.js";
import { publicProcedure, router } from "../_core/trpc.js";
import {
  getUserByEmail,
  getUserById,
  getUserByOpenId,
  listUsers,
  setUserRole,
  upsertUser,
} from "../db.js";
import { LOCAL_AUTH_ROLES } from "./shared.js";

export const authRouter = router({
  me: publicProcedure.query((opts) => opts.ctx.user),

  localUsers: publicProcedure.query(async () => {
    const users = await listUsers(12);
    return users.map((user) => ({
      id: user.id,
      openId: user.openId,
      email: user.email,
      name: user.name,
      role: user.role,
    }));
  }),

  localLogin: publicProcedure
    .input(
      z.object({
        email: z.string().email().optional(),
        openId: z.string().min(3).optional(),
        name: z.string().min(1).max(100).optional(),
        role: z.enum(LOCAL_AUTH_ROLES).default("customer"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const normalizedEmail = input.email?.trim().toLowerCase();
      const normalizedOpenId = input.openId?.trim();

      let user = normalizedOpenId
        ? await getUserByOpenId(normalizedOpenId)
        : normalizedEmail
          ? await getUserByEmail(normalizedEmail)
          : undefined;

      if (!user) {
        const role = input.role;
        const openId = normalizedOpenId ?? `local_${role}_${nanoid(10)}`;
        const name =
          input.name?.trim() ||
          normalizedEmail?.split("@")[0] ||
          `Local ${role}`;

        await upsertUser({
          openId,
          name,
          email: normalizedEmail ?? null,
          loginMethod: "local",
          role,
          lastSignedIn: new Date(),
        });

        user = await getUserByOpenId(openId);
      } else if (user.role !== input.role) {
        await setUserRole(user.id, input.role);
        user = await getUserById(user.id);
      }

      if (!user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create local session user.",
        });
      }

      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name ?? normalizedEmail ?? user.openId,
      });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);

      return {
        success: true,
        user: {
          id: user.id,
          openId: user.openId,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      } as const;
    }),

  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),
});
