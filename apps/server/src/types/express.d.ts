import type { UserRole } from "@akademik/shared";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    role?: UserRole;
  }
}

export {};
