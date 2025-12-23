"use client";

import { Badge } from "@iso/ui/components/badge";
import { Button } from "@iso/ui/components/button";
import { Input } from "@iso/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@iso/ui/components/select";
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  Pencil,
  Trash2,
  Plus,
  GitCommit,
  Search,
  Filter,
  ChevronDown,
  User,
  Download,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { useActivity } from "@/hooks/use-api";

type ActionType = "created" | "updated" | "deleted" | "verified" | "flagged" | "approved" | "rejected" | "downloaded" | "uploaded" | "merged";

const actionConfig: Record<string, { icon: typeof Database; color: string; bg: string }> = {
  created: { icon: Plus, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  updated: { icon: Pencil, color: "text-blue-400", bg: "bg-blue-500/10" },
  deleted: { icon: Trash2, color: "text-red-400", bg: "bg-red-500/10" },
  verified: { icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/10" },
  flagged: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10" },
  approved: { icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/10" },
  rejected: { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10" },
  downloaded: { icon: Download, color: "text-cyan-400", bg: "bg-cyan-500/10" },
  uploaded: { icon: Upload, color: "text-violet-400", bg: "bg-violet-500/10" },
  merged: { icon: GitCommit, color: "text-purple-400", bg: "bg-purple-500/10" },
};

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function ActivityPage() {
  const [filter, setFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useActivity({
    entityType: entityFilter !== "all" ? entityFilter : undefined,
    page,
    limit: 50,
  });

  const items = data?.items ?? [];
  const filteredItems = items.filter((item) => {
    if (filter !== "all" && item.action !== filter) return false;
    if (search) {
      const searchLower = search.toLowerCase();
      const dataStr = JSON.stringify(item.data ?? {}).toLowerCase();
      if (!dataStr.includes(searchLower) && !item.entityId?.toLowerCase().includes(searchLower)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="p-8 max-w-4xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white">Activity Log</h1>
        <p className="mt-1 text-zinc-400">
          Track all changes across the archive
        </p>
      </header>

      {/* Filters */}
      <div className="mb-6 flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Search activity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-36">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="created">Created</SelectItem>
            <SelectItem value="updated">Updated</SelectItem>
            <SelectItem value="deleted">Deleted</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="flagged">Flagged</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-36">
            <Database className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Entity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entities</SelectItem>
            <SelectItem value="iso">ISOs</SelectItem>
            <SelectItem value="distro">Distros</SelectItem>
            <SelectItem value="family">Families</SelectItem>
            <SelectItem value="edit">Edits</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Activity Timeline */}
      {isLoading ? (
        <div className="py-12 text-center text-zinc-500">Loading...</div>
      ) : (
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-px bg-zinc-800" />

          <div className="space-y-1">
            {filteredItems.map((item) => {
              const config = actionConfig[item.action] ?? actionConfig.updated;
              const Icon = config.icon;
              const isExpanded = expanded === item.id;
              const hasDetails = item.data && Object.keys(item.data).length > 0;

              return (
                <div key={item.id} className="relative pl-12">
                  <div className={`absolute left-3 top-4 flex h-5 w-5 items-center justify-center rounded-full ${config.bg} ring-4 ring-zinc-950`}>
                    <Icon className={`h-3 w-3 ${config.color}`} />
                  </div>

                  <div
                    className={`rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 transition-colors hover:bg-zinc-900/80 ${hasDetails ? "cursor-pointer" : ""}`}
                    onClick={() => hasDetails && setExpanded(isExpanded ? null : item.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={`${config.color} border-current/20`}>
                            {item.action}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {item.entityType}
                          </Badge>
                          {item.entityId && (
                            <span className="font-medium text-white">#{item.entityId}</span>
                          )}
                        </div>

                        {isExpanded && hasDetails && (
                          <div className="mt-3 rounded-md bg-zinc-800/50 p-3 font-mono text-xs overflow-x-auto">
                            <pre className="text-zinc-300">{JSON.stringify(item.data, null, 2)}</pre>
                          </div>
                        )}
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-xs text-zinc-500">
                          {formatRelativeTime(item.createdAt)}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-zinc-600">
                          <User className="h-3 w-3" />
                          {item.actor?.username ?? item.actor?.userId ?? "system"}
                        </div>
                        {hasDetails && (
                          <ChevronDown className={`h-4 w-4 text-zinc-600 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredItems.length === 0 && (
            <div className="py-12 text-center text-zinc-500">
              No activity found
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {data && data.total > data.limit && (
        <div className="mt-6 flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="flex items-center px-3 text-sm text-zinc-400">
            Page {page} of {Math.ceil(data.total / data.limit)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= Math.ceil(data.total / data.limit)}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
