import type { UserRole } from "../types/user.js";

export const ROLE_PERMISSIONS: Record<
  UserRole,
  readonly string[]
> = {
  student: ["articles:read", "tests:take", "electro:read"],
  teacher: [
    "articles:read",
    "articles:write",
    "tests:take",
    "tests:write",
    "electro:read",
    "users:read",
  ],
  researcher: [
    "articles:read",
    "articles:write",
    "tests:take",
    "tests:write",
    "electro:read",
    "electro:write",
    "users:read",
  ],
};

export function roleHasPermission(role: UserRole, permission: string): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
