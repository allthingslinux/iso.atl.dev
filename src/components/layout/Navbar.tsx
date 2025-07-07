"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

import config from "@/config/gIndex.config";
import { NO_LAYOUT_PATHS } from "@/constant";

import { SearchCommand } from "@/components/search/SearchCommand";

import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const pathname = usePathname();

  if (NO_LAYOUT_PATHS.some((path) => new RegExp(path).test(pathname)))
    return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full h-16 px-6">
        <div className="grid grid-cols-3 h-full items-center mx-auto tablet:grid-cols-2">
          {/* Left Section - Logo */}
          <div className="flex items-center justify-start">
            <Link href="/" className="flex items-center space-x-3">
              <div className="relative flex items-center justify-center">
                <Image
                  src={config.siteConfig.siteIcon}
                  alt={config.siteConfig.siteName}
                  width={32}
                  height={32}
                  className="h-8 w-8"
                />
                <div
                  className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-success animate-pulse shadow-sm"
                  style={{ backgroundColor: "hsl(var(--color-success))" }}
                ></div>
              </div>
              <div className="hidden font-mono text-sm font-semibold sm:flex flex-col">
                <span className="text-foreground leading-tight">
                  {config.siteConfig.siteName}
                </span>
                <span className="text-xs text-muted-foreground font-mono leading-tight">
                  v{config.version} • ONLINE
                </span>
              </div>
            </Link>
          </div>

          {/* Center Section - Search */}
          <div className="flex justify-center">
            <div className="w-64">
              <div className="[&>button]:!w-full">
                <SearchCommand />
              </div>
            </div>
          </div>

          {/* Right Section - Theme Changer */}
          <div className="flex items-center justify-end">
            <ThemeToggle variant="desktop" />
          </div>
        </div>
      </div>
    </header>
  );
}
