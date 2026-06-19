import { Elysia, t } from "elysia";
import { prisma } from "../lib/prisma";

export const menuRoutes = new Elysia({ prefix: "/menu" })
  .get(
    "/",
    async ({ query }) => {
      const { category, limit = "20", offset = "0", available } = query;
      const where: any = {};
      if (category) where.category = category;
      if (available !== undefined) where.available = available === "true";

      const [data, total] = await Promise.all([
        prisma.menuItem.findMany({
          where,
          take: parseInt(limit),
          skip: parseInt(offset),
          orderBy: { createdAt: "desc" },
        }),
        prisma.menuItem.count({ where }),
      ]);

      return { data, total, limit: parseInt(limit), offset: parseInt(offset) };
    },
    {
      query: t.Object({
        category: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
        available: t.Optional(t.String()),
      }),
    }
  )
  .get(
    "/search",
    async ({ query }) => {
      const { q = "", limit = "10" } = query;
      const data = await prisma.menuItem.findMany({
        where: {
          available: true,
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { category: { contains: q, mode: "insensitive" } },
          ],
        },
        take: parseInt(limit),
        select: { id: true, name: true, price: true, imageUrl: true, category: true, description: true },
      });
      return { data, total: data.length };
    },
    {
      query: t.Object({
        q: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
    }
  )
  .get("/:id", async ({ params, set }) => {
    const item = await prisma.menuItem.findUnique({ where: { id: params.id } });
    if (!item) {
      set.status = 404;
      return { error: "Menu item not found", code: "RESOURCE_NOT_FOUND" };
    }
    return item;
  });
