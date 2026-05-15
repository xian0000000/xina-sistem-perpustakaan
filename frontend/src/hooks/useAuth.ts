// src/hooks/useAuth.ts

"use client";

import { useState, useEffect, useCallback } from "react";
import { refreshSession, login, register, logout, getRole, getCurrentUser } from "@/lib/auth";
import type { AuthUser, Role } from "@/lib/types";

interface UseAuthReturn {
  user: AuthUser | null;
  role: Role;
  isLoading: boolean;
  isAdmin: boolean;
  isMember: boolean;
  isGuest: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // restore session dari httpOnly cookie saat page load
  useEffect(() => {
    refreshSession()
      .then((u) => setUser(u))
      .finally(() => setIsLoading(false));
  }, []);

  const handleLogin = useCallback(async (email: string, password: string) => {
    const u = await login(email, password);
    setUser(u);
  }, []);

  const handleRegister = useCallback(async (name: string, email: string, password: string) => {
    const u = await register(name, email, password);
    setUser(u);
  }, []);

  const handleLogout = useCallback(async () => {
    await logout();
    setUser(null);
  }, []);

  const role = user?.role ?? null;

  return {
    user,
    role,
    isLoading,
    isAdmin: role === "admin" || role === "librarian",
    isMember: role === "member",
    isGuest: role === null,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
  };
}