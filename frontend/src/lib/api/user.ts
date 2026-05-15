// src/lib/api/user.ts

import { authHeader } from "@/lib/auth";
import type { UserProfile, UpdateProfileRequest, AdminUpdateUserRequest } from "@/lib/types";

const USER_URL = "http://localhost:8081";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${USER_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || `Request gagal: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// ─── member ───────────────────────────────────────────────────────────────────
export function getMyProfile(): Promise<UserProfile> {
  return request("/users/me");
}

export function updateMyProfile(data: UpdateProfileRequest): Promise<UserProfile> {
  return request("/users/me", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// ─── admin / librarian ────────────────────────────────────────────────────────
export function getAllUsers(): Promise<UserProfile[]> {
  return request("/users");
}

export function getUserById(id: number): Promise<UserProfile> {
  return request(`/users/${id}`);
}

export function adminUpdateUser(id: number, data: AdminUpdateUserRequest): Promise<UserProfile> {
  return request(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteUser(id: number): Promise<void> {
  return request(`/users/${id}`, { method: "DELETE" });
}