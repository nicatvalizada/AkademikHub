import { env } from "./config/env.js";
import { corsOptions } from "./config/cors.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { securityHeaders } from "./middleware/securityHeaders.js";
import { articleRoutes } from "./modules/articles/article.routes.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { testRoutes } from "./modules/tests/test.routes.js";
import { userRoutes } from "./modules/users/user.routes.js";
import MongoStore from "connect-mongo";
import cors from "cors";
import express from "express";
import session from "express-session";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  if (env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  app.use(securityHeaders);
  app.use(cors(corsOptions));
  app.use(express.json({ limit: "1mb" }));

  app.use(
    session({
      name: "akademik.sid",
      secret: env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: env.MONGODB_URI,
        ttl: 60 * 60 * 24 * 14,
      }),
      cookie: {
        httpOnly: true,
        sameSite: env.NODE_ENV === "production" ? "strict" : "lax",
        secure: env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 24 * 14,
      },
    }),
  );

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "akademik-server" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/articles", articleRoutes);
  app.use("/api/tests", testRoutes);

  app.use(errorHandler);

  return app;
}
