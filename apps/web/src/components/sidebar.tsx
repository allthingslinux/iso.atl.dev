"use client";

import { cn } from "@iso/ui/lib/utils";
import {
  ChevronRight,
  Database,
  LayoutGrid,
  Library,
  RefreshCw,
  Settings,
  UserCircle,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { trpc } from "../trpc/client";

const navItems = [
  { name: "Library", href: "/", icon: Library },
  { name: "Staging Area", href: "/staging", icon: LayoutGrid },
  { name: "Sync Dashboard", href: "/sync", icon: RefreshCw },
];

export function Sidebar() {
  const pathname = usePathname();
  const mockUserId = "mock-user-1";
  const { data: reputation } = trpc.curation.getReputation.useQuery({
    userId: mockUserId,
  });

  return (
    <aside className="fixed top-0 left-0 z-40 flex h-screen w-64 flex-col border-zinc-800 border-r bg-zinc-950">
      <div className="flex h-16 items-center px-6">
        <Link className="group flex items-center gap-2" href="/">
          <div className="rounded-lg bg-indigo-600 p-1.5 transition-colors group-hover:bg-indigo-500">
            <Database className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg text-zinc-100 tracking-tight">
            ISO Archive
          </span>
        </Link>
      </div>

      <nav className="mt-4 flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              className={cn(
                "group flex items-center justify-between rounded-md px-3 py-2 font-medium text-sm transition-all duration-200",
                isActive
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-100"
              )}
              href={item.href}
              key={item.href}
            >
              <div className="flex items-center gap-3">
                <item.icon
                  className={cn(
                    "h-4 w-4 transition-colors",
                    isActive
                      ? "text-indigo-400"
                      : "text-zinc-500 group-hover:text-zinc-300"
                  )}
                />
                {item.name}
              </div>
              {!!isActive && (
                <ChevronRight className="h-3 w-3 text-indigo-400" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-zinc-800 border-t p-4">
        <div className="flex items-center gap-3 rounded-lg border border-zinc-800/40 bg-zinc-900/40 px-2 py-3">
          <div className="relative">
            <UserCircle className="h-10 w-10 text-zinc-600" />
            <div className="absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full border-2 border-zinc-900 bg-indigo-500" />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-semibold text-xs text-zinc-200">
              Curator Panel
            </span>
            <div className="mt-0.5 flex items-center gap-1.5">
              <div className="rounded-md border border-indigo-500/20 bg-indigo-500/10 px-1.5 py-0.5">
                <span className="font-bold text-[10px] text-indigo-400 uppercase tracking-wider">
                  Rep: {reputation ?? 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        <Link
          className="mt-3 flex items-center gap-2 px-3 py-2 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
          href="/settings"
        >
          <Settings className="h-3.5 w-3.5" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
