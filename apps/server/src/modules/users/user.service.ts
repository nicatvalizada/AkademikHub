import {
  DEFAULT_USER_PROFILE_COLOR,
  type UserProfileUpdateInput,
  type UserRole,
} from "@akademik/shared";
import type { UserDoc } from "./user.model.js";
import { UserModel } from "./user.model.js";

function toPublic(user: UserDoc & { _id: unknown; createdAt?: Date; updatedAt?: Date }) {
  return {
    id: String(user._id),
    email: user.email,
    name: user.name,
    role: user.role,
    profileColor: user.profileColor ?? DEFAULT_USER_PROFILE_COLOR,
    createdAt: user.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: user.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}

export async function findUserById(id: string) {
  const u = await UserModel.findById(id).lean();
  if (!u) return null;
  return toPublic(u as UserDoc & { _id: unknown; createdAt?: Date; updatedAt?: Date });
}

export async function findUserByEmail(email: string) {
  const u = await UserModel.findOne({ email: email.toLowerCase() }).lean();
  if (!u) return null;
  return {
    ...toPublic(u as UserDoc & { _id: unknown; createdAt?: Date; updatedAt?: Date }),
    passwordHash: u.passwordHash,
  };
}

export async function listUsers() {
  const rows = await UserModel.find().sort({ createdAt: -1 }).lean();
  return rows.map((u) =>
    toPublic(u as UserDoc & { _id: unknown; createdAt?: Date; updatedAt?: Date }),
  );
}

export async function updateUserRole(userId: string, role: UserRole) {
  const u = await UserModel.findByIdAndUpdate(
    userId,
    { role },
    { new: true, runValidators: true },
  ).lean();
  if (!u) return null;
  return toPublic(u as UserDoc & { _id: unknown; createdAt?: Date; updatedAt?: Date });
}

export async function updateMyProfile(userId: string, input: UserProfileUpdateInput) {
  const u = await UserModel.findByIdAndUpdate(
    userId,
    {
      name: input.name,
      profileColor: input.profileColor,
    },
    { new: true, runValidators: true },
  ).lean();
  if (!u) return null;
  return toPublic(u as UserDoc & { _id: unknown; createdAt?: Date; updatedAt?: Date });
}
