import type { ILoginRequest, IRegisterRequest, IUser } from "@akademik/shared";
import { api } from "./client";

type ApiOk<T> = { success: true; data: T };

export async function register(body: IRegisterRequest): Promise<IUser> {
  const { data } = await api.post<ApiOk<IUser>>("/api/auth/register", body);
  return data.data;
}

export async function login(body: ILoginRequest): Promise<IUser> {
  const { data } = await api.post<ApiOk<IUser>>("/api/auth/login", body);
  return data.data;
}

export async function logout(): Promise<void> {
  await api.post<ApiOk<{ ok: boolean }>>("/api/auth/logout");
}

export async function fetchMe(): Promise<IUser | null> {
  try {
    const { data } = await api.get<ApiOk<IUser>>("/api/auth/me");
    return data.data;
  } catch {
    return null;
  }
}
