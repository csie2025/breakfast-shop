import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { authRoutes } from "./routes/auth";
import { menuRoutes } from "./routes/menu";
import { cartRoutes } from "./routes/cart";
import { ordersRoutes } from "./routes/orders";
import { kitchenRoutes } from "./routes/kitchen";
import { adminRoutes } from "./routes/admin";

const app = new Elysia()
  .use(
    cors({
      origin: ({ request }: { request: Request }) => {
        const origin = request.headers.get("origin") || "";
        const allowed = process.env.FRONTEND_URL;
        if (!allowed || allowed === "*") return true;
        if (origin === allowed) return true;
        if (origin.endsWith(".onrender.com")) return true;
        if (origin.includes("localhost")) return true;
        return false;
      },
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    })
  )
  .use(
    swagger({
      documentation: {
        info: {
          title: "🥐 早餐店網路訂購系統 API",
          version: "1.0.0",
          description: "Breakfast Shop Online Ordering System - Complete API Documentation",
        },
        tags: [
          { name: "auth", description: "Authentication endpoints" },
          { name: "menu", description: "Menu management" },
          { name: "cart", description: "Shopping cart" },
          { name: "orders", description: "Order management" },
          { name: "kitchen", description: "Kitchen Display System" },
          { name: "admin", description: "Admin management" },
        ],
      },
    })
  )
  .get("/", () => ({
    message: "🥐 早餐店網路訂購系統 API",
    version: "1.0.0",
    docs: "/swagger",
    status: "healthy",
    timestamp: new Date().toISOString(),
  }))
  .get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }))
  .group("/api", (app) =>
    app
      .use(authRoutes)
      .use(menuRoutes)
      .use(cartRoutes)
      .use(ordersRoutes)
      .use(kitchenRoutes)
      .use(adminRoutes)
  )
  .onError(({ error, set, code }) => {
    console.error(`[Error] ${code}:`, error);

    if (code === "VALIDATION") {
      set.status = 400;
      return {
        error: "Invalid request data",
        code: "INVALID_REQUEST_BODY",
        details: error.message,
      };
    }

    if (code === "NOT_FOUND") {
      set.status = 404;
      return { error: "Route not found", code: "RESOURCE_NOT_FOUND" };
    }

    const msg = error instanceof Error ? error.message : "Internal Server Error";
    if (msg === "Unauthorized") { set.status = 401; return { error: msg, code: "INVALID_TOKEN" }; }
    if (msg === "Insufficient permissions") { set.status = 403; return { error: msg, code: "INSUFFICIENT_PERMISSIONS" }; }

    set.status = 500;
    return { error: "Internal server error", code: "INTERNAL_ERROR" };
  })
  .listen(process.env.PORT || 3001);

console.log(`🥐 早餐店 API running at ${app.server?.hostname}:${app.server?.port}`);
console.log(`📚 Swagger docs: http://localhost:${app.server?.port}/swagger`);

export type App = typeof app;
