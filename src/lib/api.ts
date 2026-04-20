import axios, { AxiosError } from "axios";

const API_URL = "/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Single in-flight refresh promise — prevents race condition when multiple
// requests get 401 simultaneously (they all share the same refresh attempt).
let refreshPromise: Promise<string> | null = null;

function doRefresh(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) throw new Error("No refresh token");
    const { data } = await axios.post(`/api/auth/refresh`, { refreshToken });
    localStorage.setItem("access_token", data.accessToken);
    localStorage.setItem("refresh_token", data.refreshToken);
    // Update expiry so dashboard layout doesn't force-logout
    try {
      const payload = JSON.parse(atob(data.accessToken.split(".")[1]));
      if (payload.exp) localStorage.setItem("token_expiry", String(payload.exp * 1000));
    } catch { /* ignore parse errors */ }
    return data.accessToken as string;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

function redirectToLogin() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("patient_id");
  localStorage.removeItem("patient_name");
  localStorage.removeItem("consent_required");
  localStorage.removeItem("token_expiry");
  window.location.replace("/auth/login");
}

// Auto-refresh on 401, redirect on expired session (401/403 after failed refresh)
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as typeof error.config & { _retry?: boolean };
    const isAuthEndpoint = original.url?.includes("/auth/login") || original.url?.includes("/auth/register") || original.url?.includes("/auth/refresh");
    const status = error.response?.status;

    if ((status === 401 || status === 403) && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      try {
        const newToken = await doRefresh();
        if (original.headers) original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        redirectToLogin();
        return new Promise(() => {});
      }
    }
    return Promise.reject(error);
  }
);

export default api;
