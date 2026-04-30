import type { LoginInput, RegisterInput } from "@akademik/shared";
import { hashPassword, verifyPassword } from "../../utils/password.js";
import * as userService from "../users/user.service.js";
import { UserModel } from "../users/user.model.js";

export async function register(input: RegisterInput) {
  const passwordHash = await hashPassword(input.password);
  const doc = await UserModel.create({
    email: input.email.toLowerCase(),
    passwordHash,
    name: input.name,
    role: "student",
  });
  const created = await userService.findUserById(String(doc._id));
  if (!created) throw new Error("İstifadəçi yaradılmadı");
  return created;
}

export async function login(input: LoginInput) {
  const user = await userService.findUserByEmail(input.email);
  if (!user) return null;
  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) return null;
  const { passwordHash: _, ...publicUser } = user;
  return publicUser;
}
