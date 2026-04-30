import type { ILoginRequest, IRegisterRequest } from "@akademik/shared";
import { useCallback, useEffect } from "react";
import * as authApi from "@/api/auth";
import { useAuthStore } from "@/store/authStore";

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const setUser = useAuthStore((s) => s.setUser);
  const setHydrated = useAuthStore((s) => s.setHydrated);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const me = await authApi.fetchMe();
      if (!cancelled) {
        setUser(me);
        setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setHydrated, setUser]);

  const login = useCallback(
    async (body: ILoginRequest) => {
      const u = await authApi.login(body);
      setUser(u);
      return u;
    },
    [setUser],
  );

  const register = useCallback(
    async (body: IRegisterRequest) => {
      const u = await authApi.register(body);
      setUser(u);
      return u;
    },
    [setUser],
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, [setUser]);

  return {
    user,
    hydrated,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };
}
