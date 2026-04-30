import type { UserRole } from "@akademik/shared";
import type { Request, Response } from "express";
import { fail, ok } from "../../utils/apiResponse.js";
import * as userService from "./user.service.js";

export async function list(_req: Request, res: Response): Promise<void> {
  const users = await userService.listUsers();
  ok(res, users);
}

export async function updateRole(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { role } = req.body as { role: UserRole };
  const updated = await userService.updateUserRole(id, role);
  if (!updated) {
    fail(res, 404, "İstifadəçi tapılmadı", "NOT_FOUND");
    return;
  }
  ok(res, updated);
}

export async function updateMe(req: Request, res: Response): Promise<void> {
  const uid = req.session.userId!;
  const updated = await userService.updateMyProfile(uid, req.body);
  if (!updated) {
    fail(res, 404, "İstifadəçi tapılmadı", "NOT_FOUND");
    return;
  }
  ok(res, updated);
}
