const TOKEN_KEY = import.meta.env.VITE_AUTH_KEY;
export const API_BASE = (import.meta.env && (import.meta.env.VITE_BASE_API || import.meta.env.VITE_API_BASE));

export function setToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    throw new Error("Failed to save token");
  }
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    throw new Error("Failed to retrieve token");
  }
}

export function removeToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    throw new Error("Failed to remove token");
  }
}

export function parseJwt(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(decoded)));
  } catch {
    throw new Error("Failed to parse token");
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
