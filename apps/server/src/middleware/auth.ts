import type { NextFunction, Request, Response } from "express";
import { fail } from "../utils/apiResponse.js";

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.session.userId) {
    fail(res, 401, "Giriş tələb olunur", "UNAUTHORIZED");
    return;
  }
  next();
}
