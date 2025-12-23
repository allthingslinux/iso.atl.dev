"use client";

import { Breadcrumb } from "./breadcrumb";
import { useAuth, DEV_USERS, type UserRole } from "@/lib/dev-auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@iso/ui/components/select";
import { Badge } from "@iso/ui/components/badge";
import { Wrench } from "lucide-react";

export function TopNav() {
  const { user, setRole } = useAuth();
  const isDev = process.env.NODE_ENV !== "production";

  return (
    <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-zinc-800/50 bg-zinc-950/80 px-6 backdrop-blur-sm">
      <Breadcrumb />
      
      {isDev && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-md border border-dashed border-amber-800/50 bg-amber-950/20 px-2 py-1">
            <Wrench className="h-3 w-3 text-amber-500" />
            <span className="text-xs text-amber-500">Dev</span>
            <Select value={user.role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger className="h-6 w-28 border-amber-800/50 bg-transparent text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DEV_USERS).map(([key, u]) => (
                  <SelectItem key={key} value={key} className="text-xs">
                    {u.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="outline" className="text-xs border-amber-800/50 text-amber-400">
              {user.reputation} rep
            </Badge>
          </div>
        </div>
      )}
    </header>
  );
}
