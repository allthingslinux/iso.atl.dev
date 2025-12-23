"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb as BreadcrumbRoot,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@iso/ui/components/breadcrumb";

const routes: Record<string, { label: string; parent?: string }> = {
  "/dashboard": { label: "Dashboard" },
  "/library": { label: "Library" },
  "/distros": { label: "Distributions", parent: "/library" },
  "/families": { label: "Families", parent: "/library" },
  "/os-types": { label: "OS Types", parent: "/library" },
  "/activity": { label: "Activity" },
  "/staging": { label: "Staging Area" },
  "/sync": { label: "Sync Dashboard" },
  "/settings": { label: "Settings" },
  "/profile": { label: "Profile" },
};

export function Breadcrumb() {
  const pathname = usePathname();

  const isIsoPage = pathname.startsWith("/iso/");
  const isDistroPage = pathname.startsWith("/distro/");

  const crumbs: { label: string; href?: string }[] = [];

  if (isIsoPage) {
    crumbs.push({ label: "Library", href: "/library" });
    crumbs.push({ label: "ISO Details" });
  } else if (isDistroPage) {
    crumbs.push({ label: "Library", href: "/library" });
    crumbs.push({ label: "Distributions", href: "/distros" });
    crumbs.push({ label: "Details" });
  } else {
    const route = routes[pathname];
    if (route?.parent) {
      const parent = routes[route.parent];
      if (parent) crumbs.push({ label: parent.label, href: route.parent });
    }
    if (route) crumbs.push({ label: route.label });
  }

  if (crumbs.length === 0) return null;

  return (
    <BreadcrumbRoot>
      <BreadcrumbList>
        {crumbs.map((crumb, i) => (
          <Fragment key={i}>
            {i > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {crumb.href ? (
                <BreadcrumbLink asChild>
                  <Link href={crumb.href}>{crumb.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </BreadcrumbRoot>
  );
}
