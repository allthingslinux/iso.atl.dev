"use client";

import { Breadcrumb } from "./breadcrumb";
import { useAuth, DEV_USERS, type DevRole } from "@/lib/auth-provider";
import { Badge } from "@iso/ui/components/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@iso/ui/components/select";
import { Wrench } from "lucide-react";

export function TopNav() {
  const { user, devMode, devRole, setDevRole } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-zinc-800/50 bg-zinc-950/80 px-6 backdrop-blur-sm">
      <Breadcrumb />
      
      {devMode && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-md border border-dashed border-amber-800/50 bg-amber-950/20 px-2 py-1">
            <Wrench className="h-3 w-3 text-amber-500" />
            <span className="text-xs text-amber-500">Dev</span>
            <Select value={devRole} onValueChange={(v) => setDevRole(v as DevRole)}>
              <SelectTrigger className="h-6 w-24 border-amber-800/50 bg-transparent text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DEV_USERS).map(([key, u]) => (
                  <SelectItem key={key} value={key} className="text-xs">
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {user && (
              <Badge variant="outline" className="text-xs border-amber-800/50 text-amber-400">
                {user.name}
              </Badge>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
