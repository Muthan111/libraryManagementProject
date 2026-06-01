const TOKEN_KEY = "library_auth_token";
export const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) || "http://localhost:3000";

export function setToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {}
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function removeToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

export function parseJwt(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(decoded)));
  } catch {
    return null;
  }
}

export async function authFetch(input: string, init: RequestInit = {}) {
  const token = getToken();
  const url = input.startsWith("http") ? input : `${API_BASE}${input}`;
  const headers = new Headers(init.headers || {});
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(url, { ...init, headers, credentials: init.credentials ?? "include" });
  return res;
}

export default {
  setToken,
  getToken,
  removeToken,
  parseJwt,
  authFetch,
};
