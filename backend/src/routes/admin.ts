import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { bearer } from "@elysiajs/bearer";
import { prisma } from "../lib/prisma";

export const adminRoutes = new Elysia({ prefix: "/admin" })
  .use(jwt({ name: "jwt", secret: process.env.JWT_SECRET || "breakfast-shop-secret-key-change-in-production" }))
  .use(bearer())
  .derive(async ({ jwt, bearer, set }) => {
    if (!bearer) { set.status = 401; throw new Error("Unauthorized"); }
    const payload = await jwt.verify(bearer);
    if (!payload) { set.status = 401; throw new Error("Unauthorized"); }
    const user = payload as any;
    if (user.role !== "ADMIN") {
      set.status = 403;
      throw new Error("Insufficient permissions");
    }
    return { adminUser: user };
  })
  // ─── Menu Management ──────────────────────────────────────────────
  .get(
    "/menu",
    async ({ query }) => {
      const { limit = "20", offset = "0", category } = query;
      const where: any = {};
      if (category) where.category = category;

      const [data, total] = await Promise.all([
        prisma.menuItem.findMany({
          where,
          take: parseInt(limit),
          skip: parseInt(offset),
          orderBy: { createdAt: "desc" },
        }),
        prisma.menuItem.count({ where }),
      ]);

      return { data: data.map(d => ({ ...d, price: Number(d.price) })), total, limit: parseInt(limit), offset: parseInt(offset) };
    },
    {
      query: t.Object({
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
        category: t.Optional(t.String()),
      }),
    }
  )
  .post(
    "/menu",
    async ({ body, set }) => {
      const item = await prisma.menuItem.create({
        data: {
          ...body,
          ingredients: body.ingredients || [],
        },
      });
      set.status = 201;
      return { ...item, price: Number(item.price) };
    },
    {
      body: t.Object({
        name: t.String(),
        description: t.String(),
        price: t.Number({ minimum: 0 }),
        category: t.String(),
        imageUrl: t.Optional(t.String()),
        available: t.Optional(t.Boolean()),
        ingredients: t.Optional(t.Array(t.String())),
      }),
    }
  )
  .put(
    "/menu/:id",
    async ({ params, body, set }) => {
      const existing = await prisma.menuItem.findUnique({ where: { id: params.id } });
      if (!existing) { set.status = 404; return { error: "Menu item not found" }; }

      const item = await prisma.menuItem.update({
        where: { id: params.id },
        data: body,
      });
      return { ...item, price: Number(item.price) };
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        description: t.Optional(t.String()),
        price: t.Optional(t.Number({ minimum: 0 })),
        category: t.Optional(t.String()),
        imageUrl: t.Optional(t.String()),
        available: t.Optional(t.Boolean()),
        ingredients: t.Optional(t.Array(t.String())),
      }),
    }
  )
  .delete("/menu/:id", async ({ params, set }) => {
    const existing = await prisma.menuItem.findUnique({ where: { id: params.id } });
    if (!existing) { set.status = 404; return { error: "Menu item not found" }; }

    await prisma.menuItem.delete({ where: { id: params.id } });
    set.status = 204;
    return;
  })
  // ─── Orders Management ────────────────────────────────────────────
  .get(
    "/orders",
    async ({ query }) => {
      const { status, startDate, endDate, limit = "20", offset = "0" } = query;
      const where: any = {};
      if (status) where.status = status;
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate + "T23:59:59Z");
      }

      const [data, total] = await Promise.all([
        prisma.order.findMany({
          where,
          take: parseInt(limit),
          skip: parseInt(offset),
          orderBy: { createdAt: "desc" },
          include: { user: { select: { name: true, email: true } } },
        }),
        prisma.order.count({ where }),
      ]);

      return {
        data: data.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          customerName: o.user.name,
          customerEmail: o.user.email,
          status: o.status,
          total: Number(o.total),
          deliveryMethod: o.deliveryMethod,
          createdAt: o.createdAt,
        })),
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      };
    },
    {
      query: t.Object({
        status: t.Optional(t.String()),
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
      }),
    }
  )
  .get("/orders/:id", async ({ params, set }) => {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        items: { include: { menuItem: { select: { name: true, imageUrl: true } } } },
        statusHistory: { orderBy: { timestamp: "asc" } },
      },
    });
    if (!order) { set.status = 404; return { error: "Order not found" }; }

    return {
      ...order,
      subtotal: Number(order.subtotal),
      tax: Number(order.tax),
      shippingFee: Number(order.shippingFee),
      total: Number(order.total),
      items: order.items.map((i) => ({
        name: i.menuItem.name,
        imageUrl: i.menuItem.imageUrl,
        quantity: i.quantity,
        price: Number(i.price),
        subtotal: Number(i.subtotal),
      })),
    };
  })
  // ─── Stats ────────────────────────────────────────────────────────
  .get(
    "/stats",
    async ({ query }) => {
      const { startDate, endDate } = query;
      const where: any = { status: { not: "cancelled" } };
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate + "T23:59:59Z");
      }

      const [orders, statusCounts] = await Promise.all([
        prisma.order.findMany({
          where,
          include: { items: { include: { menuItem: { select: { name: true } } } } },
        }),
        prisma.order.groupBy({
          by: ["status"],
          _count: true,
          where: startDate || endDate ? { createdAt: where.createdAt } : undefined,
        }),
      ]);

      const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
      const totalOrders = orders.length;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Top menu items
      const itemMap = new Map<string, { name: string; quantity: number; revenue: number; id: string }>();
      for (const order of orders) {
        for (const item of order.items) {
          const key = item.menuItemId;
          const existing = itemMap.get(key) || { id: key, name: item.menuItem.name, quantity: 0, revenue: 0 };
          existing.quantity += item.quantity;
          existing.revenue += Number(item.subtotal);
          itemMap.set(key, existing);
        }
      }
      const topMenuItems = Array.from(itemMap.values())
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      // Daily revenue
      const dailyMap = new Map<string, { revenue: number; orders: number }>();
      for (const order of orders) {
        const date = order.createdAt.toISOString().slice(0, 10);
        const existing = dailyMap.get(date) || { revenue: 0, orders: 0 };
        existing.revenue += Number(order.total);
        existing.orders += 1;
        dailyMap.set(date, existing);
      }
      const dailyRevenue = Array.from(dailyMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const ordersByStatus = statusCounts.reduce((acc: any, s) => {
        acc[s.status] = s._count;
        return acc;
      }, {});

      return {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        topMenuItems,
        dailyRevenue,
        ordersByStatus,
      };
    },
    {
      query: t.Object({
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
      }),
    }
  );
