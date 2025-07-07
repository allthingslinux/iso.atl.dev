"use client";

import { Fragment, useState } from "react";

import Link from "next/link";

import config from "@/config/gIndex.config";
import { Home } from "lucide-react";
import { type z } from "zod";

import { type Schema_Breadcrumb } from "@/types/schema";

import { cn } from "@/lib/utils";

import useLoading from "@/hooks/useLoading";

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  ResponsiveDropdownMenu,
  ResponsiveDropdownMenuContent,
  ResponsiveDropdownMenuItem,
  ResponsiveDropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.responsive";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  data?: z.infer<typeof Schema_Breadcrumb>[];
};

export default function FileBreadcrumb({ data }: Props) {
  const loading = useLoading();
  const [open, setOpen] = useState<boolean>(false);
  const breadcrumbs = data ?? [];

  if (loading) {
    return <Skeleton className="my-2 h-6 w-1/2" />;
  }

  // Helper function to build href for breadcrumb items
  const buildHref = (index: number): string => {
    const pathSegments = breadcrumbs
      .slice(0, index + 1)
      .map((item) => item.href)
      .filter(Boolean);

    return pathSegments.length > 0 ? `/${pathSegments.join("/")}` : "/";
  };

  // Split breadcrumbs for ellipsis handling
  const maxVisible = config.siteConfig.breadcrumbMax;
  const shouldShowEllipsis = breadcrumbs.length > maxVisible;
  const hiddenItems = shouldShowEllipsis
    ? breadcrumbs.slice(0, -maxVisible + 1)
    : [];
  const visibleItems = shouldShowEllipsis
    ? breadcrumbs.slice(-maxVisible + 1)
    : breadcrumbs;

  return (
    <Breadcrumb>
      <BreadcrumbList className="flex-wrap">
        {/* Root */}
        <BreadcrumbItem>
          <BreadcrumbLink
            asChild
            className="flex items-center gap-1.5 font-mono"
          >
            <Link href="/">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {breadcrumbs.length > 0 && (
          <>
            <BreadcrumbSeparator />

            {/* Ellipsis dropdown for hidden items */}
            {shouldShowEllipsis && (
              <>
                <BreadcrumbItem>
                  <ResponsiveDropdownMenu open={open} onOpenChange={setOpen}>
                    <ResponsiveDropdownMenuTrigger asChild>
                      <BreadcrumbEllipsis className="h-4 w-4 cursor-pointer" />
                    </ResponsiveDropdownMenuTrigger>
                    <ResponsiveDropdownMenuContent
                      header={{
                        title: "Navigate",
                        description: "Navigate to parent directories",
                      }}
                    >
                      {hiddenItems.map((item, index) => (
                        <ResponsiveDropdownMenuItem
                          key={`breadcrumb-${item.label}-${index}`}
                          closeOnSelect
                          asChild
                        >
                          <Link
                            href={buildHref(index)}
                            className="flex items-center gap-2 truncate"
                          >
                            <span className="truncate">{item.label}</span>
                          </Link>
                        </ResponsiveDropdownMenuItem>
                      ))}
                    </ResponsiveDropdownMenuContent>
                  </ResponsiveDropdownMenu>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </>
            )}

            {/* Visible breadcrumb items */}
            {visibleItems.map((item, index) => {
              const actualIndex = shouldShowEllipsis
                ? hiddenItems.length + index
                : index;
              const isLast = actualIndex === breadcrumbs.length - 1;
              const href = item.href ? buildHref(actualIndex) : undefined;

              return (
                <Fragment key={`breadcrumb-${item.label}-${actualIndex}`}>
                  <BreadcrumbItem>
                    {href && !isLast ? (
                      <BreadcrumbLink asChild>
                        <Link
                          href={href}
                          className={cn(
                            "max-w-48 truncate font-mono",
                            "transition-colors hover:text-foreground"
                          )}
                          title={item.label}
                        >
                          {item.label}
                        </Link>
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage
                        className={cn(
                          "max-w-48 truncate font-medium font-mono",
                          "text-foreground"
                        )}
                        title={item.label}
                      >
                        {item.label}
                      </BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                  {!isLast && <BreadcrumbSeparator />}
                </Fragment>
              );
            })}
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
