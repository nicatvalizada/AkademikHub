import { userProfileUpdateSchema, userRoleSchema } from "@akademik/shared";
import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/roles.js";
import { validateBody } from "../../middleware/validate.js";
import * as ctrl from "./user.controller.js";

const r = Router();

r.patch("/me", requireAuth, validateBody(userProfileUpdateSchema), ctrl.updateMe);
r.get("/", requireRole("teacher", "researcher"), ctrl.list);
r.patch(
  "/:id/role",
  requireRole("researcher"),
  validateBody(z.object({ role: userRoleSchema })),
  ctrl.updateRole,
);

export const userRoutes = r;
