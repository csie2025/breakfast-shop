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
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  )
  .use(
    swagger({
      documentation: {
        info: {
          title: "早餐店 API",
          version: "1.0.0",
        },
      },
    })
  )
  .get("/", () => ({
    message: "🥐 早餐店 API",
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
  .onError(({ error, set, code }: any) => {
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    if (code === "VALIDATION") { set.status = 400; return { error: "Invalid request data" }; }
    if (code === "NOT_FOUND") { set.status = 404; return { error: "Route not found" }; }
    if (msg === "Unauthorized") { set.status = 401; return { error: msg }; }
    if (msg === "Insufficient permissions") { set.status = 403; return { error: msg }; }
    set.status = 500;
    return { error: "Internal server error" };
  })
  .listen(process.env.PORT || 3001);

console.log(`🥐 早餐店 API running at ${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;