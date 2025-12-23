"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@iso/ui/components/card";
import { Badge } from "@iso/ui/components/badge";
import { Button } from "@iso/ui/components/button";
import { ThumbsUp, ThumbsDown, Clock, User, ChevronRight } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

type Edit = {
  id: string;
  userId: string;
  targetType: string;
  targetId: string | null;
  operation: string;
  status: string;
  newData: Record<string, unknown>;
  oldData: Record<string, unknown> | null;
  voteCount: number;
  destructive: boolean;
  comment: string | null;
  createdAt: string;
  expiresAt: string | null;
};

export default function EditsPage() {
  const [edits, setEdits] = useState<Edit[]>([]);
  const [filter, setFilter] = useState<string>("pending");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/api/v1/curation/edits?status=${filter}`)
      .then((r) => r.json())
      .then((data) => {
        setEdits(data.items || []);
        setLoading(false);
      });
  }, [filter]);

  const handleVote = async (editId: string, vote: "accept" | "reject") => {
    await fetch(`${API_URL}/api/v1/curation/edits/${editId}/votes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vote }),
    });
    // Refresh
    const res = await fetch(`${API_URL}/api/v1/curation/edits?status=${filter}`);
    const data = await res.json();
    setEdits(data.items || []);
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400",
    accepted: "bg-green-500/20 text-green-400",
    rejected: "bg-red-500/20 text-red-400",
    immediate_accepted: "bg-green-500/20 text-green-400",
    immediate_rejected: "bg-red-500/20 text-red-400",
    failed: "bg-red-500/20 text-red-400",
    canceled: "bg-zinc-500/20 text-zinc-400",
  };

  const operationColors: Record<string, string> = {
    create: "bg-green-500/20 text-green-400",
    modify: "bg-blue-500/20 text-blue-400",
    destroy: "bg-red-500/20 text-red-400",
  };

  const filters = ["pending", "accepted", "rejected", "canceled"];

  return (
    <div className="p-8 max-w-4xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white">Edit Queue</h1>
        <p className="mt-1 text-zinc-400">
          Review and vote on proposed changes to the archive.
        </p>
      </header>

      {/* Filter tabs */}
      <div className="flex gap-2 border-b border-zinc-800 mb-6">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors capitalize ${
              filter === f
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Edit list */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading...</p>
        ) : edits.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No {filter} edits.
          </p>
        ) : (
          edits.map((edit) => (
            <EditCard
              key={edit.id}
              edit={edit}
              statusColors={statusColors}
              operationColors={operationColors}
              onVote={handleVote}
            />
          ))
        )}
      </div>
    </div>
  );
}

function EditCard({
  edit,
  statusColors,
  operationColors,
  onVote,
}: {
  edit: Edit;
  statusColors: Record<string, string>;
  operationColors: Record<string, string>;
  onVote: (id: string, vote: "accept" | "reject") => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const changedFields = edit.oldData
    ? Object.keys(edit.newData).filter(
        (k) => JSON.stringify(edit.newData[k]) !== JSON.stringify(edit.oldData?.[k])
      )
    : Object.keys(edit.newData);

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div
          className="p-4 flex items-center gap-4 cursor-pointer hover:bg-muted/50"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={operationColors[edit.operation]}>
                {edit.operation}
              </Badge>
              <Badge className={statusColors[edit.status]}>
                {edit.status.replace("_", " ")}
              </Badge>
              {edit.destructive && (
                <Badge variant="destructive">destructive</Badge>
              )}
            </div>
            <p className="text-sm">
              <span className="text-muted-foreground">{edit.targetType}</span>
              {edit.targetId && (
                <span className="text-muted-foreground"> #{edit.targetId}</span>
              )}
              <span className="mx-2">·</span>
              <span className="text-muted-foreground">{changedFields.length} field(s)</span>
            </p>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {timeAgo(edit.createdAt)}
            </span>
            <span className={`font-medium ${edit.voteCount > 0 ? "text-green-400" : edit.voteCount < 0 ? "text-red-400" : ""}`}>
              {edit.voteCount > 0 ? "+" : ""}{edit.voteCount}
            </span>
            <ChevronRight className={`h-4 w-4 transition-transform ${expanded ? "rotate-90" : ""}`} />
          </div>
        </div>

        {/* Expanded content */}
        {expanded && (
          <div className="border-t border-zinc-800 p-4 space-y-4">
            {/* Comment */}
            {edit.comment && (
              <p className="text-sm text-muted-foreground italic">"{edit.comment}"</p>
            )}

            {/* Diff */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase">Changes</p>
              <div className="grid gap-2">
                {changedFields.map((field) => (
                  <div key={field} className="flex items-start gap-2 text-sm">
                    <span className="font-mono text-muted-foreground w-32 shrink-0">{field}</span>
                    {edit.oldData && (
                      <>
                        <span className="text-red-400 line-through">
                          {JSON.stringify(edit.oldData[field]) || "null"}
                        </span>
                        <span className="text-muted-foreground">→</span>
                      </>
                    )}
                    <span className="text-green-400">
                      {JSON.stringify(edit.newData[field])}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Vote buttons */}
            {edit.status === "pending" && (
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-green-400 border-green-400/50 hover:bg-green-400/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onVote(edit.id, "accept");
                  }}
                >
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-400 border-red-400/50 hover:bg-red-400/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onVote(edit.id, "reject");
                  }}
                >
                  <ThumbsDown className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
