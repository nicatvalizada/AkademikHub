import type { IUser, UserProfileUpdateInput } from "@akademik/shared";
import { api } from "./client";

type ApiOk<T> = { success: true; data: T };

export async function listUsers(): Promise<IUser[]> {
  const { data } = await api.get<ApiOk<IUser[]>>("/api/users");
  return data.data;
}

export async function updateMyProfile(body: UserProfileUpdateInput): Promise<IUser> {
  const { data } = await api.patch<ApiOk<IUser>>("/api/users/me", body);
  return data.data;
}
