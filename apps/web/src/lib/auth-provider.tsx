"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useSession, signIn, signOut } from "./auth-client";

// Dev mode users for testing without OAuth
const DEV_USERS = {
  guest: { id: "guest", name: "Guest", email: "guest@dev.local", image: null },
  user: { id: "dev-user-1", name: "Test User", email: "user@dev.local", image: null },
  editor: { id: "dev-editor-1", name: "Test Editor", email: "editor@dev.local", image: null },
  admin: { id: "dev-admin-1", name: "Test Admin", email: "admin@dev.local", image: null },
} as const;

type DevRole = keyof typeof DEV_USERS;

interface AuthContextType {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  } | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  canEdit: boolean;
  canModerate: boolean;
  canAdmin: boolean;
  signInWithDiscord: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  logout: () => Promise<void>;
  // Dev mode
  devMode: boolean;
  devRole: DevRole;
  setDevRole: (role: DevRole) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();
  const isDev = process.env.NODE_ENV !== "production";
  
  // Dev mode state
  const [devRole, setDevRole] = useState<DevRole>("guest");
  const [devModeEnabled, setDevModeEnabled] = useState(false);

  // Load dev mode from localStorage
  useEffect(() => {
    if (isDev) {
      const saved = localStorage.getItem("dev-auth-role");
      if (saved && saved in DEV_USERS) {
        setDevRole(saved as DevRole);
        setDevModeEnabled(true);
      }
    }
  }, [isDev]);

  // Save dev role to localStorage
  const handleSetDevRole = (role: DevRole) => {
    setDevRole(role);
    setDevModeEnabled(role !== "guest");
    localStorage.setItem("dev-auth-role", role);
  };

  // Use dev user if in dev mode and no real session
  const effectiveUser = isDev && devModeEnabled && devRole !== "guest"
    ? DEV_USERS[devRole]
    : session?.user ?? null;

  const isAuthenticated = !!effectiveUser;

  const value: AuthContextType = {
    user: effectiveUser,
    isLoading: isPending,
    isAuthenticated,
    canEdit: isAuthenticated && (devRole === "editor" || devRole === "admin" || !!session?.user),
    canModerate: isAuthenticated && (devRole === "admin" || !!session?.user),
    canAdmin: devRole === "admin" || !!session?.user,
    signInWithDiscord: async () => {
      await signIn.social({ provider: "discord" });
    },
    signInWithGithub: async () => {
      await signIn.social({ provider: "github" });
    },
    logout: async () => {
      if (devModeEnabled) {
        handleSetDevRole("guest");
      } else {
        await signOut();
      }
    },
    devMode: isDev,
    devRole,
    setDevRole: handleSetDevRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { DEV_USERS, type DevRole };
