// src/lib/auth.ts

import type { AuthUser, Role } from "./types";

const AUTH_URL = "http://localhost:8080";

// ─── in-memory access token ───────────────────────────────────────────────────
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string): void {
  accessToken = token;
}

export function clearAccessToken(): void {
  accessToken = null;
}

// ─── user state ───────────────────────────────────────────────────────────────
let currentUser: AuthUser | null = null;

export function getCurrentUser(): AuthUser | null {
  return currentUser;
}

export function getRole(): Role {
  return currentUser?.role ?? null;
}

export function isAdmin(): boolean {
  return currentUser?.role === "admin" || currentUser?.role === "librarian";
}

export function isMember(): boolean {
  return currentUser?.role === "member";
}

// ─── auth header helper ───────────────────────────────────────────────────────
export function authHeader(): Record<string, string> {
  return accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : {};
}

// ─── login ────────────────────────────────────────────────────────────────────
export async function login(email: string, password: string): Promise<AuthUser> {
  const res = await fetch(`${AUTH_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Login gagal");
  }

  const data = await res.json();
  accessToken = data.access_token;
  currentUser = data.user;
  localStorage.setItem("refresh_token", data.refresh_token);
  return currentUser!;
}

// ─── register ─────────────────────────────────────────────────────────────────
export async function register(name: string, email: string, password: string): Promise<AuthUser> {
  const res = await fetch(`${AUTH_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Registrasi gagal");
  }

  const data = await res.json();
  accessToken = data.access_token;
  currentUser = data.user;
  localStorage.setItem("refresh_token", data.refresh_token);
  return currentUser!;
}

// ─── refresh ──────────────────────────────────────────────────────────────────
export async function refreshSession(): Promise<AuthUser | null> {
  try {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) return null;

    const res = await fetch(`${AUTH_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      localStorage.removeItem("refresh_token");
      return null;
    }

    const data = await res.json();
    accessToken = data.access_token;
    currentUser = data.user;
    localStorage.setItem("refresh_token", data.refresh_token);
    return currentUser;
  } catch {
    return null;
  }
}

// ─── logout ───────────────────────────────────────────────────────────────────
export async function logout(): Promise<void> {
  const refreshToken = localStorage.getItem("refresh_token");
  try {
    await fetch(`${AUTH_URL}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  } finally {
    accessToken = null;
    currentUser = null;
    localStorage.removeItem("refresh_token");
  }
}
