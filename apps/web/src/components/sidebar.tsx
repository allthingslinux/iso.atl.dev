"use client";

import { cn } from "@iso/ui/lib/utils";
import {
  ChevronRight,
  Clock,
  Database,
  LayoutGrid,
  Library,
  LibraryBig,
  RefreshCw,
  Settings,
  Activity,
  LogIn,
  Sparkles,
  FileEdit,
  Award,
  SquareLibrary,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-provider";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { 
    name: "Library", 
    href: "/library", 
    icon: LibraryBig,
    items: [
      { name: "All ISOs", href: "/library" },
      { name: "OS Types", href: "/os-types" },
      { name: "Families", href: "/families" },
      { name: "Distributions", href: "/distros" },
    ]
  },
  { name: "Better", href: "/better", icon: Sparkles },
  { name: "Edit Queue", href: "/edits", icon: FileEdit },
  { name: "Metrics", href: "/metrics", icon: BarChart3 },
  { name: "Activity", href: "/activity", icon: Activity },
  { name: "Staging Area", href: "/staging", icon: Clock },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>(["Library"]);

  const toggleExpand = (name: string) => {
    setExpandedItems(prev => 
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const isItemActive = (item: typeof navItems[0]) => {
    if (item.items) {
      return item.items.some(sub => sub.href === pathname);
    }
    return pathname === item.href;
  };

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

      <nav className="mt-4 flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = isItemActive(item);
          const isExpanded = expandedItems.includes(item.name);
          const hasSubItems = item.items && item.items.length > 0;

          return (
            <div key={item.name}>
              {hasSubItems ? (
                <div
                  className={cn(
                    "group flex items-center justify-between rounded-md px-3 py-2 font-medium text-sm transition-all duration-200",
                    isActive
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-100"
                  )}
                >
                  <Link href={item.href} className="flex items-center gap-3 flex-1">
                    <item.icon
                      className={cn(
                        "h-4 w-4 transition-colors",
                        isActive
                          ? "text-indigo-400"
                          : "text-zinc-500 group-hover:text-zinc-300"
                      )}
                    />
                    {item.name}
                  </Link>
                  <button
                    onClick={() => toggleExpand(item.name)}
                    className="p-1 -mr-1 rounded hover:bg-zinc-800"
                  >
                    <ChevronRight className={cn(
                      "h-3 w-3 text-zinc-500 transition-transform",
                      isExpanded && "rotate-90"
                    )} />
                  </button>
                </div>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-md px-3 py-2 font-medium text-sm transition-all duration-200",
                    isActive
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-100"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-4 w-4 transition-colors",
                      isActive
                        ? "text-indigo-400"
                        : "text-zinc-500 group-hover:text-zinc-300"
                    )}
                  />
                  {item.name}
                </Link>
              )}
              
              {hasSubItems && isExpanded && (
                <div className="ml-4 mt-1 mb-1 border-l border-zinc-800 pl-3">
                  {item.items.map((subItem) => {
                    const isSubActive = pathname === subItem.href;
                    return (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        className={cn(
                          "flex items-center h-7 px-3 text-sm",
                          isSubActive
                            ? "text-indigo-400"
                            : "text-zinc-500 hover:text-zinc-200"
                        )}
                      >
                        {subItem.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="mt-auto border-zinc-800 border-t p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-300" />
          </div>
        ) : user ? (
          <>
            <Link
              href="/profile"
              className="flex items-center gap-3 rounded-lg border border-zinc-800/40 bg-zinc-900/40 px-3 py-3 transition-colors hover:bg-zinc-800/50"
            >
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name}
                  className="h-9 w-9 rounded-full"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium text-zinc-200">
                  {user.name}
                </span>
                <span className="truncate text-xs text-zinc-500">{user.email}</span>
              </div>
            </Link>

            <button
              onClick={() => logout()}
              className="mt-3 flex w-full items-center gap-2 px-3 py-2 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
            >
              <Settings className="h-3.5 w-3.5" />
              Sign out
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800/50 hover:text-white"
          >
            <LogIn className="h-4 w-4" />
            Sign in
          </Link>
        )}
      </div>
    </aside>
  );
}
