import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { bearer } from "@elysiajs/bearer";
import { prisma } from "../lib/prisma";

export const kitchenRoutes = new Elysia({ prefix: "/kitchen" })
  .use(jwt({ name: "jwt", secret: process.env.JWT_SECRET || "breakfast-shop-secret-key-change-in-production" }))
  .use(bearer())
  .derive(async ({ jwt, bearer, set }) => {
    if (!bearer) { set.status = 401; throw new Error("Unauthorized"); }
    const payload = await jwt.verify(bearer);
    if (!payload) { set.status = 401; throw new Error("Unauthorized"); }
    const user = payload as any;
    if (user.role !== "STAFF" && user.role !== "ADMIN") {
      set.status = 403;
      throw new Error("Insufficient permissions");
    }
    return { staffUser: user };
  })
  .get(
    "/orders",
    async ({ query }) => {
      const { status } = query;
      const where: any = {};
      if (status) {
        where.status = status;
      } else {
        where.status = { in: ["pending", "preparing", "ready"] };
      }

      const [data, total] = await Promise.all([
        prisma.order.findMany({
          where,
          orderBy: { createdAt: "asc" },
          include: {
            user: { select: { name: true } },
            items: { include: { menuItem: { select: { name: true } } } },
          },
        }),
        prisma.order.count({ where }),
      ]);

      return {
        data: data.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          customerName: o.user.name,
          items: o.items.map((i) => ({ name: i.menuItem.name, quantity: i.quantity })),
          status: o.status,
          deliveryMethod: o.deliveryMethod,
          notes: o.notes,
          createdAt: o.createdAt,
        })),
        total,
      };
    },
    {
      query: t.Object({
        status: t.Optional(t.String()),
      }),
    }
  )
  .put(
    "/orders/:id/status",
    async ({ params, body, set }) => {
      const { status } = body;
      const validTransitions: Record<string, string[]> = {
        pending: ["preparing", "cancelled"],
        preparing: ["ready", "cancelled"],
        ready: ["completed"],
        completed: [],
        cancelled: [],
      };

      const order = await prisma.order.findUnique({ where: { id: params.id } });
      if (!order) { set.status = 404; return { error: "Order not found" }; }

      if (!validTransitions[order.status]?.includes(status)) {
        set.status = 400;
        return { error: `Cannot transition from ${order.status} to ${status}` };
      }

      const updated = await prisma.order.update({
        where: { id: params.id },
        data: {
          status,
          statusHistory: { create: [{ status }] },
        },
      });

      return { id: updated.id, status: updated.status, updatedAt: updated.updatedAt };
    },
    {
      body: t.Object({
        status: t.Union([
          t.Literal("preparing"),
          t.Literal("ready"),
          t.Literal("completed"),
          t.Literal("cancelled"),
        ]),
      }),
    }
  );
