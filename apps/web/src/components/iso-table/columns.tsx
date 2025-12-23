"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@iso/ui/components/badge";
import { Button } from "@iso/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@iso/ui/components/dropdown-menu";
import { Ellipsis, ExternalLink, Copy, Flag, CheckCircle2, Clock, FlaskConical, AlertTriangle } from "lucide-react";
import Link from "next/link";

export type IsoRow = {
  id: number;
  filename: string;
  version: string | null;
  arch: string | null;
  edition: string | null;
  spin: string | null;
  isoType: string | null;
  releaseStage: string | null;
  libc: string | null;
  initSystem: string | null;
  hardwareTarget: string | null;
  size: number | null;
  status: string | null;
  distroSlug: string | null;
  distroName: string | null;
  familyName: string | null;
};

const statusIcons: Record<string, { icon: typeof CheckCircle2; className: string; label: string }> = {
  verified: { icon: CheckCircle2, className: "text-emerald-400", label: "Verified" },
  pending: { icon: Clock, className: "text-amber-400", label: "Pending" },
  staging: { icon: FlaskConical, className: "text-blue-400", label: "Staging" },
  flagged: { icon: AlertTriangle, className: "text-red-400", label: "Flagged" },
};

const badgeColors: Record<string, string> = {
  verified: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  staging: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  flagged: "bg-red-500/10 text-red-400 border-red-500/20",
};

export const columns: ColumnDef<IsoRow>[] = [
  {
    accessorKey: "status",
    header: "",
    size: 40,
    cell: ({ row }) => {
      const status = row.original.status;
      if (!status) return null;
      const config = statusIcons[status];
      if (!config) return null;
      const Icon = config.icon;
      return (
        <div className="flex justify-center">
          <Icon className={`h-4 w-4 ${config.className}`} aria-label={config.label} />
        </div>
      );
    },
  },
  {
    accessorKey: "distroName",
    header: "Distro",
    cell: ({ row }) => (
      <Link href={`/iso/${row.original.id}`} className="font-medium text-white hover:text-indigo-400">
        {row.original.distroName}
      </Link>
    ),
    size: 120,
    enableHiding: false,
  },
  {
    accessorKey: "version",
    header: "Version",
    size: 80,
  },
  {
    accessorKey: "arch",
    header: "Arch",
    size: 70,
  },
  {
    accessorKey: "edition",
    header: "Edition",
    size: 80,
    cell: ({ row }) => row.original.edition || "-",
  },
  {
    accessorKey: "spin",
    header: "Desktop",
    size: 80,
    cell: ({ row }) => row.original.spin || "-",
  },
  {
    accessorKey: "isoType",
    header: "Type",
    size: 70,
  },
  {
    accessorKey: "releaseStage",
    header: "Stage",
    size: 70,
  },
  {
    accessorKey: "initSystem",
    header: "Init",
    size: 70,
    cell: ({ row }) => row.original.initSystem || "-",
  },
  {
    accessorKey: "libc",
    header: "Libc",
    size: 60,
    cell: ({ row }) => row.original.libc || "-",
  },
  {
    accessorKey: "size",
    header: () => <div className="text-right">Size</div>,
    size: 70,
    cell: ({ row }) => {
      const size = row.original.size;
      if (!size) return <div className="text-right">-</div>;
      let formatted: string;
      if (size >= 1e9) formatted = `${(size / 1e9).toFixed(1)} GB`;
      else if (size >= 1e6) formatted = `${(size / 1e6).toFixed(0)} MB`;
      else formatted = `${size}`;
      return <div className="text-right font-mono text-sm">{formatted}</div>;
    },
  },
  {
    id: "actions",
    size: 40,
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
            <Ellipsis className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem asChild>
            <Link href={`/iso/${row.original.id}`}>
              <ExternalLink className="mr-2 h-4 w-4" />
              View details
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(row.original.filename)}>
            <Copy className="mr-2 h-4 w-4" />
            Copy filename
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-400">
            <Flag className="mr-2 h-4 w-4" />
            Flag ISO
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];
