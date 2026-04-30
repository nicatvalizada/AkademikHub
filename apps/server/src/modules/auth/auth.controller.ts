import type { UserRole } from "@akademik/shared";
import type { Request, Response } from "express";
import { env } from "../../config/env.js";
import { fail, ok } from "../../utils/apiResponse.js";
import * as authService from "./auth.service.js";

function setSessionUser(
  req: Request,
  user: { id: string; role: UserRole },
): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) {
        reject(err);
        return;
      }
      req.session.userId = user.id;
      req.session.role = user.role;
      resolve();
    });
  });
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const user = await authService.register(req.body);
    await setSessionUser(req, user);
    ok(res, user, 201);
  } catch (e: unknown) {
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code: number }).code === 11000
    ) {
      fail(res, 409, "Bu email artıq qeydiyyatdan keçib", "EMAIL_TAKEN");
      return;
    }
    throw e;
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const user = await authService.login(req.body);
  if (!user) {
    fail(res, 401, "Email və ya şifrə yanlışdır", "INVALID_CREDENTIALS");
    return;
  }
  await setSessionUser(req, user);
  ok(res, user);
}

export async function logout(req: Request, res: Response): Promise<void> {
  req.session.destroy((err) => {
    if (err) {
      fail(res, 500, "Sessiya bağlanmadı", "SESSION");
      return;
    }
    res.clearCookie("akademik.sid", {
      path: "/",
      sameSite: env.NODE_ENV === "production" ? "strict" : "lax",
      secure: env.NODE_ENV === "production",
    });
    ok(res, { ok: true });
  });
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.session.userId) {
    fail(res, 401, "Giriş tələb olunur", "UNAUTHORIZED");
    return;
  }
  const { findUserById } = await import("../users/user.service.js");
  const user = await findUserById(req.session.userId);
  if (!user) {
    req.session.destroy(() => undefined);
    fail(res, 401, "Sessiya etibarsızdır", "STALE_SESSION");
    return;
  }
  ok(res, user);
}
