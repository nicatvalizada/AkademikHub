import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ??
  (import.meta.env.DEV ? "" : "");

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const message =
      err.response?.data?.error?.message ?? err.message ?? "Şəbəkə xətası";
    return Promise.reject(new Error(message));
  },
);
