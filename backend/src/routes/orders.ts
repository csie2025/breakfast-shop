import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { bearer } from "@elysiajs/bearer";
import { prisma } from "../lib/prisma";

const TAX_RATE = 0.05;
const DELIVERY_FEE = 30;

function generateOrderNumber() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `ORD-${date}-${rand}`;
}

export const ordersRoutes = new Elysia({ prefix: "/orders" })
  .use(jwt({ name: "jwt", secret: process.env.JWT_SECRET || "breakfast-shop-secret-key-change-in-production" }))
  .use(bearer())
  .derive(async ({ jwt, bearer, set }) => {
    if (!bearer) { set.status = 401; throw new Error("Unauthorized"); }
    const payload = await jwt.verify(bearer);
    if (!payload) { set.status = 401; throw new Error("Unauthorized"); }
    return { currentUser: payload as { id: string; email: string; name: string; role: string } };
  })
  .post(
    "/",
    async ({ currentUser, body, set }) => {
      const { items, deliveryAddress, deliveryMethod = "pickup", paymentMethod = "mock", notes } = body;

      if (!items || items.length === 0) {
        set.status = 400;
        return { error: "Cart is empty", code: "CART_EMPTY" };
      }

      // Validate and price items
      const menuItems = await prisma.menuItem.findMany({
        where: { id: { in: items.map((i: any) => i.menuItemId) }, available: true },
      });

      if (menuItems.length !== items.length) {
        set.status = 400;
        return { error: "One or more items are unavailable", code: "MENU_ITEM_UNAVAILABLE" };
      }

      const orderItems = items.map((item: any) => {
        const menuItem = menuItems.find((m) => m.id === item.menuItemId)!;
        const price = Number(menuItem.price);
        return { menuItemId: item.menuItemId, quantity: item.quantity, price, subtotal: price * item.quantity };
      });

      const subtotal = orderItems.reduce((s: number, i: any) => s + i.subtotal, 0);
      const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
      const shippingFee = deliveryMethod === "delivery" ? DELIVERY_FEE : 0;
      const total = subtotal + tax + shippingFee;

      const order = await prisma.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId: currentUser.id,
          subtotal,
          tax,
          shippingFee,
          total,
          status: "pending",
          deliveryAddress: deliveryAddress || null,
          deliveryMethod,
          paymentMethod,
          notes: notes || null,
          items: {
            create: orderItems.map((i: any) => ({
              menuItemId: i.menuItemId,
              quantity: i.quantity,
              price: i.price,
              subtotal: i.subtotal,
            })),
          },
          statusHistory: {
            create: [{ status: "pending" }],
          },
        },
        include: {
          items: { include: { menuItem: { select: { name: true } } } },
          statusHistory: true,
        },
      });

      // Clear cart
      const cart = await prisma.cart.findUnique({ where: { userId: currentUser.id } });
      if (cart) await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

      set.status = 201;
      return {
        id: order.id,
        orderNumber: order.orderNumber,
        userId: order.userId,
        items: order.items.map((i) => ({
          menuItemId: i.menuItemId,
          name: i.menuItem.name,
          quantity: i.quantity,
          price: Number(i.price),
          subtotal: Number(i.subtotal),
        })),
        subtotal: Number(order.subtotal),
        tax: Number(order.tax),
        shippingFee: Number(order.shippingFee),
        total: Number(order.total),
        status: order.status,
        deliveryAddress: order.deliveryAddress,
        deliveryMethod: order.deliveryMethod,
        paymentMethod: order.paymentMethod,
        notes: order.notes,
        createdAt: order.createdAt,
      };
    },
    {
      body: t.Object({
        items: t.Array(
          t.Object({ menuItemId: t.String(), quantity: t.Number({ minimum: 1 }) })
        ),
        deliveryAddress: t.Optional(t.String()),
        deliveryMethod: t.Optional(t.Union([t.Literal("pickup"), t.Literal("delivery")])),
        paymentMethod: t.Optional(t.Union([t.Literal("credit_card"), t.Literal("debit_card"), t.Literal("cash"), t.Literal("mock")])),
        notes: t.Optional(t.String()),
      }),
    }
  )
  .get(
    "/",
    async ({ currentUser, query }) => {
      const { status, limit = "10", offset = "0" } = query;
      const where: any = { userId: currentUser.id };
      if (status) where.status = status;

      const [data, total] = await Promise.all([
        prisma.order.findMany({
          where,
          take: parseInt(limit),
          skip: parseInt(offset),
          orderBy: { createdAt: "desc" },
          select: { id: true, orderNumber: true, status: true, total: true, createdAt: true },
        }),
        prisma.order.count({ where }),
      ]);

      return {
        data: data.map((o) => ({ ...o, total: Number(o.total) })),
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      };
    },
    {
      query: t.Object({
        status: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
      }),
    }
  )
  .get("/:id/status", async ({ currentUser, params, set }) => {
    const order = await prisma.order.findFirst({
      where: { id: params.id, userId: currentUser.id },
      select: { id: true, status: true, updatedAt: true },
    });
    if (!order) { set.status = 404; return { error: "Order not found" }; }
    return order;
  })
  .get("/:id", async ({ currentUser, params, set }) => {
    const order = await prisma.order.findFirst({
      where: { id: params.id, userId: currentUser.id },
      include: {
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
        menuItemId: i.menuItemId,
        name: i.menuItem.name,
        imageUrl: i.menuItem.imageUrl,
        quantity: i.quantity,
        price: Number(i.price),
        subtotal: Number(i.subtotal),
      })),
    };
  })
  .put("/:id/cancel", async ({ currentUser, params, set }) => {
    const order = await prisma.order.findFirst({
      where: { id: params.id, userId: currentUser.id },
    });
    if (!order) { set.status = 404; return { error: "Order not found" }; }
    if (!["pending"].includes(order.status)) {
      set.status = 400;
      return { error: "Cannot cancel order in current status", code: "ORDER_NOT_CANCELLABLE" };
    }

    const updated = await prisma.order.update({
      where: { id: params.id },
      data: {
        status: "cancelled",
        statusHistory: { create: [{ status: "cancelled" }] },
      },
    });

    return { id: updated.id, status: updated.status, cancelledAt: updated.updatedAt };
  });
