import type { IUser, UserRole } from "@akademik/shared";
import { create } from "zustand";

type AuthState = {
  user: IUser | null;
  hydrated: boolean;
  setUser: (user: IUser | null) => void;
  setHydrated: (v: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  hydrated: false,
  setUser: (user) => set({ user }),
  setHydrated: (hydrated) => set({ hydrated }),
}));

export function selectRole(state: AuthState): UserRole | null {
  return state.user?.role ?? null;
}
