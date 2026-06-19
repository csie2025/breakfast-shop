import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { bearer } from "@elysiajs/bearer";
import { prisma } from "../lib/prisma";

const TAX_RATE = 0.05;
const DELIVERY_FEE = 30;

async function getOrCreateCart(userId: string) {
  let cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: { menuItem: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
      include: {
        items: { include: { menuItem: true } },
      },
    });
  }
  return cart;
}

function calculateCartTotals(items: any[]) {
  const subtotal = items.reduce((sum, item) => sum + Number(item.menuItem.price) * item.quantity, 0);
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  return { subtotal, tax };
}

export const cartRoutes = new Elysia({ prefix: "/cart" })
  .use(jwt({ name: "jwt", secret: process.env.JWT_SECRET || "breakfast-shop-secret-key-change-in-production" }))
  .use(bearer())
  .derive(async ({ jwt, bearer, set }) => {
    if (!bearer) { set.status = 401; throw new Error("Unauthorized"); }
    const payload = await jwt.verify(bearer);
    if (!payload) { set.status = 401; throw new Error("Unauthorized"); }
    return { userId: (payload as any).id };
  })
  .get("/", async ({ userId }) => {
    const cart = await getOrCreateCart(userId);
    const { subtotal, tax } = calculateCartTotals(cart.items);

    return {
      id: cart.id,
      userId: cart.userId,
      items: cart.items.map((item) => ({
        id: item.id,
        menuItemId: item.menuItemId,
        name: item.menuItem.name,
        price: Number(item.menuItem.price),
        quantity: item.quantity,
        subtotal: Number(item.menuItem.price) * item.quantity,
        imageUrl: item.menuItem.imageUrl,
      })),
      subtotal,
      tax,
      shippingFee: 0,
      total: subtotal + tax,
      updatedAt: cart.updatedAt,
    };
  })
  .post(
    "/",
    async ({ userId, body, set }) => {
      const { menuItemId, quantity } = body;

      const menuItem = await prisma.menuItem.findUnique({ where: { id: menuItemId } });
      if (!menuItem) { set.status = 404; return { error: "Menu item not found" }; }
      if (!menuItem.available) { set.status = 400; return { error: "Menu item unavailable", code: "MENU_ITEM_UNAVAILABLE" }; }

      const cart = await getOrCreateCart(userId);
      const existing = cart.items.find((i) => i.menuItemId === menuItemId);

      let cartItem;
      if (existing) {
        cartItem = await prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + quantity },
        });
      } else {
        cartItem = await prisma.cartItem.create({
          data: { cartId: cart.id, menuItemId, quantity },
        });
      }

      set.status = 201;
      return {
        id: cartItem.id,
        menuItemId,
        quantity: cartItem.quantity,
        subtotal: Number(menuItem.price) * cartItem.quantity,
      };
    },
    {
      body: t.Object({
        menuItemId: t.String(),
        quantity: t.Number({ minimum: 1 }),
      }),
    }
  )
  .put(
    "/:itemId",
    async ({ userId, params, body, set }) => {
      const { quantity } = body;
      if (quantity < 1) { set.status = 400; return { error: "Invalid quantity" }; }

      const cart = await getOrCreateCart(userId);
      const item = cart.items.find((i) => i.id === params.itemId);
      if (!item) { set.status = 404; return { error: "Cart item not found" }; }

      const updated = await prisma.cartItem.update({
        where: { id: params.itemId },
        data: { quantity },
      });

      return {
        id: updated.id,
        quantity: updated.quantity,
        subtotal: Number(item.menuItem.price) * updated.quantity,
      };
    },
    {
      body: t.Object({ quantity: t.Number({ minimum: 1 }) }),
    }
  )
  .delete("/:itemId", async ({ userId, params, set }) => {
    const cart = await getOrCreateCart(userId);
    const item = cart.items.find((i) => i.id === params.itemId);
    if (!item) { set.status = 404; return { error: "Cart item not found" }; }

    await prisma.cartItem.delete({ where: { id: params.itemId } });
    set.status = 204;
    return;
  })
  .delete("/", async ({ userId, set }) => {
    const cart = await getOrCreateCart(userId);
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    set.status = 204;
    return;
  });
