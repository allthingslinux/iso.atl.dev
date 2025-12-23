"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@iso/ui/components/command";
import { Library, Layers, FolderTree, Monitor, Clock, RefreshCw, Settings, LayoutGrid, Activity } from "lucide-react";

const routes = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { label: "Library", href: "/library", icon: Library },
  { label: "Distributions", href: "/distros", icon: Layers },
  { label: "Families", href: "/families", icon: FolderTree },
  { label: "OS Types", href: "/os-types", icon: Monitor },
  { label: "Activity", href: "/activity", icon: Activity },
  { label: "Staging Area", href: "/staging", icon: Clock },
  { label: "Sync Dashboard", href: "/sync", icon: RefreshCw },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const navigate = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Pages">
          {routes.map((route) => (
            <CommandItem key={route.href} onSelect={() => navigate(route.href)}>
              <route.icon className="mr-2 h-4 w-4" />
              {route.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
