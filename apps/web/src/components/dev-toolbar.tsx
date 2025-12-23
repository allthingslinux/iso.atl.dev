"use client";

import { useAuth, DEV_USERS, type UserRole } from "@/lib/dev-auth";

export function DevToolbar() {
  const { user, setRole } = useAuth();

  // Only show in development
  if (process.env.NODE_ENV === "production") return null;

  return (
    <div className="fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-xs shadow-lg">
      <span className="text-zinc-500">Dev:</span>
      <select
        className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-zinc-300"
        value={user.role}
        onChange={(e) => setRole(e.target.value as UserRole)}
      >
        {Object.entries(DEV_USERS).map(([key, u]) => (
          <option key={key} value={key}>
            {u.username} ({u.role})
          </option>
        ))}
      </select>
      <span className="text-zinc-500">Rep: {user.reputation}</span>
    </div>
  );
}
