import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { ZodError } from "zod";
import { fail } from "../utils/apiResponse.js";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    fail(res, 400, err.errors.map((e) => e.message).join(", "), "VALIDATION");
    return;
  }
  if (err instanceof multer.MulterError) {
    fail(res, 400, err.message, "UPLOAD");
    return;
  }
  console.error("[error]", err);
  fail(res, 500, "Daxili server xətası", "INTERNAL");
}
