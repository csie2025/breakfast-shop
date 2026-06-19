import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { bearer } from "@elysiajs/bearer";

export const authMiddleware = new Elysia({ name: "auth" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "breakfast-shop-secret-key-change-in-production",
      exp: "24h",
    })
  )
  .use(bearer())
  .derive(async ({ jwt, bearer, set }) => {
    if (!bearer) {
      return { user: null };
    }
    try {
      const payload = await jwt.verify(bearer);
      if (!payload) {
        return { user: null };
      }
      return {
        user: payload as {
          id: string;
          email: string;
          name: string;
          role: "USER" | "STAFF" | "ADMIN";
        },
      };
    } catch {
      return { user: null };
    }
  });

export const requireAuth = (app: Elysia) =>
  app.derive(({ user, set }) => {
    if (!user) {
      set.status = 401;
      throw new Error("Unauthorized");
    }
    return { user };
  });

export const requireRole = (role: "USER" | "STAFF" | "ADMIN") => (app: Elysia) =>
  app.derive(({ user, set }) => {
    if (!user) {
      set.status = 401;
      throw new Error("Unauthorized");
    }
    const roleHierarchy = { USER: 0, STAFF: 1, ADMIN: 2 };
    if (roleHierarchy[user.role] < roleHierarchy[role]) {
      set.status = 403;
      throw new Error("Insufficient permissions");
    }
    return { user };
  });
