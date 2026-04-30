import type { UserRole } from "@akademik/shared";
import type { NextFunction, Request, Response } from "express";
import { fail } from "../utils/apiResponse.js";
import { requireAuth } from "./auth.js";

export function requireRole(...allowed: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    requireAuth(req, res, () => {
      const role = req.session.role;
      if (!role || !allowed.includes(role)) {
        fail(res, 403, "Bu əməliyyat üçün icazəniz yoxdur", "FORBIDDEN");
        return;
      }
      next();
    });
  };
}
