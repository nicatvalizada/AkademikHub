import { Router } from "express";
import { loginSchema, registerSchema } from "@akademik/shared";
import { authRateLimit } from "../../middleware/rateLimit.js";
import { validateBody } from "../../middleware/validate.js";
import * as ctrl from "./auth.controller.js";

const r = Router();

r.post("/register", authRateLimit, validateBody(registerSchema), ctrl.register);
r.post("/login", authRateLimit, validateBody(loginSchema), ctrl.login);
r.post("/logout", ctrl.logout);
r.get("/me", ctrl.me);

export const authRoutes = r;
