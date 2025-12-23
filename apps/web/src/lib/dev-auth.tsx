"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type UserRole = "guest" | "user" | "editor" | "moderator" | "admin";

export interface DevUser {
  id: string;
  username: string;
  role: UserRole;
  reputation: number;
}

const DEV_USERS: Record<string, DevUser> = {
  guest: { id: "guest", username: "Guest", role: "guest", reputation: 0 },
  user: { id: "user-1", username: "RegularUser", role: "user", reputation: 10 },
  editor: { id: "editor-1", username: "TrustedEditor", role: "editor", reputation: 100 },
  moderator: { id: "mod-1", username: "Moderator", role: "moderator", reputation: 500 },
  admin: { id: "admin-1", username: "Admin", role: "admin", reputation: 1000 },
};

interface AuthContextType {
  user: DevUser;
  setRole: (role: UserRole) => void;
  isAuthenticated: boolean;
  canEdit: boolean;
  canModerate: boolean;
  canAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function DevAuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>("guest");

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("dev-auth-role");
    if (saved && saved in DEV_USERS) setRole(saved as UserRole);
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem("dev-auth-role", role);
  }, [role]);

  const user = DEV_USERS[role];
  const value: AuthContextType = {
    user,
    setRole,
    isAuthenticated: role !== "guest",
    canEdit: ["editor", "moderator", "admin"].includes(role),
    canModerate: ["moderator", "admin"].includes(role),
    canAdmin: role === "admin",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within DevAuthProvider");
  return ctx;
}

export { DEV_USERS };
