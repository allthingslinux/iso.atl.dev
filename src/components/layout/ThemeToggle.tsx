"use client";

import { useState } from "react";

import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";

import { useHydration } from "@/hooks/useHydration";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Icon from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ThemeToggleProps {
  variant?: "desktop" | "mobile";
}

export default function ThemeToggle({ variant = "desktop" }: ThemeToggleProps) {
  const { theme, themes, setTheme } = useTheme();
  const mounted = useHydration();
  const [themeOpen, setThemeOpen] = useState(false);

  // Show skeleton during hydration to prevent mismatch
  if (!mounted) {
    return <Skeleton className="h-10 w-10 rounded-md" />;
  }

  const getThemeIcon = (themeValue: string | undefined) => {
    switch (themeValue) {
      case "light":
        return "Sun";
      case "dark":
        return "Moon";
      default:
        return "Monitor"; // system theme
    }
  };

  const currentIcon = getThemeIcon(theme);

  if (variant === "mobile") {
    return (
      <Drawer
        open={themeOpen}
        onOpenChange={setThemeOpen}
        shouldScaleBackground
      >
        <DrawerTrigger asChild>
          <Button variant={"ghost"} size={"icon"}>
            <Icon name={currentIcon} className="text-foreground" />
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="text-start">
            <DrawerTitle>Theme</DrawerTitle>
            <DrawerDescription>Choose your preferred theme</DrawerDescription>
          </DrawerHeader>

          <div className="grid gap-2 px-4">
            {themes.map((item) => (
              <Button
                key={item}
                variant={theme === item ? "secondary" : "outline"}
                size={"default"}
                className="w-full"
                disabled={item === theme}
                onClick={() => {
                  setTheme(item);
                }}
              >
                <div className="flex w-full items-center justify-between">
                  <span className={cn("capitalize")}>{item}</span>
                  <Icon
                    name={item === theme ? "Check" : getThemeIcon(item)}
                    size={"1rem"}
                  />
                </div>
              </Button>
            ))}
          </div>

          <DrawerFooter>
            <DrawerClose asChild>
              <Button className="w-full" variant={"secondary"}>
                Close
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <DropdownMenu modal={false} open={themeOpen} onOpenChange={setThemeOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant={"ghost"} size={"icon"}>
              <div
                className={cn(
                  "flex flex-col items-center justify-center",
                  "opacity-80",
                  "hover:opacity-100",
                  "cursor-pointer",
                  "p-1.5"
                )}
              >
                <Icon name={currentIcon} size={"1.25rem"} />
              </div>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Site theme</p>
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent>
        {themes.map((item) => (
          <DropdownMenuItem
            key={item}
            disabled={item === theme}
            className="w-full"
            onClick={() => setTheme(item)}
          >
            <div className="flex w-full items-center justify-between">
              <span className={cn("capitalize")}>{item}</span>
              <Icon
                name={item === theme ? "Check" : getThemeIcon(item)}
                className="stroke-foreground"
              />
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
