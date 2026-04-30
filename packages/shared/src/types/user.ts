export type UserRole = "student" | "teacher" | "researcher";

export const DEFAULT_USER_PROFILE_COLOR = "#3b82f6";

export interface IUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  profileColor: string;
  createdAt: string;
  updatedAt: string;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IRegisterRequest {
  email: string;
  password: string;
  name: string;
}
