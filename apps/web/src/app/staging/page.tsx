"use client";

import { Button } from "@iso/ui/components/button";
import { cn } from "@iso/ui/lib/utils";
import { LayoutGrid, RefreshCw } from "lucide-react";
import { useState } from "react";
import { usePendingIsos, useUpdateIso } from "@/hooks/use-api";

export default function StagingPage() {
  const [processingId, setProcessingId] = useState<number | null>(null);
  const mockUserId = "mock-user-1";

  const { data: pendingIsos, isLoading } = usePendingIsos();

  const updateMutation = useUpdateIso();

  const handleApprove = (id: number) => {
    setProcessingId(id);
    updateMutation.mutate(
      { id, status: "approved", reviewedBy: mockUserId },
      {
        onSettled: () => setProcessingId(null),
      }
    );
  };

  const handleReject = (id: number) => {
    setProcessingId(id);
    updateMutation.mutate(
      { id, status: "rejected", reviewedBy: mockUserId },
      {
        onSettled: () => setProcessingId(null),
      }
    );
  };

  return (
    <div className="p-8">
      <header className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="mb-2 font-bold text-3xl text-white tracking-tight">
            Staging Area
          </h1>
          <p className="text-sm text-zinc-400">
            Review recently indexed ISOs and certify them for the library.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5">
            <div className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
            <span className="font-bold text-amber-500 text-xs uppercase tracking-tight">
              {pendingIsos?.length ?? 0} Pending Review
            </span>
          </div>
        </div>
      </header>

      <div className="grid max-w-5xl grid-cols-1 gap-4">
        {!!isLoading && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 border-dashed py-20 text-zinc-500">
            <RefreshCw className="mb-4 h-8 w-8 animate-spin text-zinc-700" />
            <p className="text-sm">Fetching pending items...</p>
          </div>
        )}

        {pendingIsos?.length === 0 && !isLoading && (
          <div className="rounded-xl border border-zinc-800 border-dashed py-20 text-center">
            <LayoutGrid className="mx-auto mb-4 h-12 w-12 text-zinc-800" />
            <p className="text-zinc-500">The staging area is empty.</p>
            <p className="mt-1 text-xs text-zinc-600">
              Excellent work, curator.
            </p>
          </div>
        )}

        {pendingIsos?.map(
          (iso: {
            id: number;
            distroName: string | null;
            version: string | null;
            arch: string | null;
            filename: string;
            confidenceScore?: number | null;
          }) => (
            <div
              className="group flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 transition-all hover:bg-zinc-900/50"
              key={iso.id}
            >
              <div className="min-w-0 flex-1 pr-8">
                <div className="mb-2 flex items-center gap-3">
                  <h2 className="font-bold text-lg text-zinc-100">
                    {iso.distroName} {iso.version}
                  </h2>
                  <span className="rounded-md border border-zinc-700/50 bg-zinc-800/80 px-2 py-0.5 font-medium font-mono text-[10px] text-zinc-400 uppercase">
                    {iso.arch}
                  </span>
                </div>
                <p
                  className="mb-4 truncate font-mono text-xs text-zinc-500"
                  title={iso.filename}
                >
                  {iso.filename}
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 overflow-hidden rounded-full border border-zinc-800 bg-zinc-950 px-2.5 py-1">
                    <div
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        (iso.confidenceScore || 0) > 80
                          ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                          : "bg-amber-500"
                      )}
                    />
                    <span className="font-bold text-[10px] text-zinc-400 uppercase tracking-tighter">
                      Match: {Math.round(iso.confidenceScore || 0)}%
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-zinc-700 tabular-nums">
                    HASHID: {iso.id}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 gap-2">
                <Button
                  className="h-9 border-zinc-800 px-4 text-zinc-400 hover:border-red-400/20 hover:bg-red-400/5 hover:text-red-400"
                  disabled={processingId === iso.id}
                  onClick={() => handleReject(iso.id)}
                  size="sm"
                  variant="outline"
                >
                  Reject
                </Button>
                <Button
                  className="h-9 border-none bg-indigo-600 px-6 text-white shadow-indigo-500/10 shadow-xl hover:bg-indigo-500"
                  disabled={processingId === iso.id}
                  onClick={() => handleApprove(iso.id)}
                  size="sm"
                  variant="default"
                >
                  Certify
                </Button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
