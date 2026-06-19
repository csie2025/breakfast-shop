import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { bearer } from "@elysiajs/bearer";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

export const authRoutes = new Elysia({ prefix: "/auth" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "breakfast-shop-secret-key-change-in-production",
      exp: "24h",
    })
  )
  .use(bearer())
  .post(
    "/register",
    async ({ body, jwt, set }) => {
      const { email, password, name } = body;

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        set.status = 400;
        return { error: "Email already exists", code: "EMAIL_ALREADY_EXISTS" };
      }

      const hashed = await bcrypt.hash(password, 12);
      const user = await prisma.user.create({
        data: { email, password: hashed, name, role: "USER" },
        select: { id: true, email: true, name: true, role: true, createdAt: true },
      });

      const token = await jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role });
      set.status = 201;
      return { user, token };
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 8 }),
        name: t.String({ minLength: 1 }),
      }),
    }
  )
  .post(
    "/login",
    async ({ body, jwt, set }) => {
      const { email, password } = body;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        set.status = 401;
        return { error: "Invalid email or password", code: "INVALID_CREDENTIALS" };
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        set.status = 401;
        return { error: "Invalid email or password", code: "INVALID_CREDENTIALS" };
      }

      const token = await jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role });
      return {
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        token,
      };
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
    }
  )
  .get("/user", async ({ bearer, jwt, set }) => {
    if (!bearer) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    const payload = await jwt.verify(bearer);
    if (!payload) {
      set.status = 401;
      return { error: "Invalid token", code: "INVALID_TOKEN" };
    }
    const user = await prisma.user.findUnique({
      where: { id: (payload as any).id },
      select: { id: true, email: true, name: true, role: true, phone: true, createdAt: true },
    });
    if (!user) {
      set.status = 404;
      return { error: "User not found" };
    }
    return user;
  })
  .put(
    "/user",
    async ({ bearer, jwt, body, set }) => {
      if (!bearer) {
        set.status = 401;
        return { error: "Unauthorized" };
      }
      const payload = await jwt.verify(bearer);
      if (!payload) {
        set.status = 401;
        return { error: "Invalid token" };
      }
      const user = await prisma.user.update({
        where: { id: (payload as any).id },
        data: body,
        select: { id: true, email: true, name: true, role: true, phone: true },
      });
      return user;
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        phone: t.Optional(t.String()),
      }),
    }
  )
  .post("/logout", () => ({ message: "Logged out successfully" }));
