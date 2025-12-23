"use client";

import Link from "next/link";

export interface IsoCardData {
  id: number;
  distroName?: string | null;
  distroSlug?: string | null;
  distroOsType?: string | null;
  familyName?: string | null;
  parentName?: string | null;
  parentSlug?: string | null;
  version?: string | null;
  arch?: string | null;
  edition?: string | null;
  spin?: string | null;
  isoType?: string | null;
  releaseStage?: string | null;
  initSystem?: string | null;
  hardwareTarget?: string | null;
  filename: string;
  size?: number | null;
  completenessScore?: number | null;
}

export function IsoCard({ iso }: { iso: IsoCardData }) {
  const formatSize = (bytes: number | null | undefined) => {
    if (!bytes) return null;
    const gb = bytes / (1024 * 1024 * 1024);
    return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  };

  const stageColors: Record<string, string> = {
    lts: "bg-green-900/50 text-green-300 border-green-800",
    stable: "bg-zinc-800 text-zinc-300 border-zinc-700",
    beta: "bg-yellow-900/50 text-yellow-300 border-yellow-800",
    alpha: "bg-orange-900/50 text-orange-300 border-orange-800",
    rc: "bg-blue-900/50 text-blue-300 border-blue-800",
    snapshot: "bg-purple-900/50 text-purple-300 border-purple-800",
    nightly: "bg-red-900/50 text-red-300 border-red-800",
  };

  const osTypeColors: Record<string, string> = {
    linux: "bg-amber-900/50 text-amber-300 border-amber-800",
    bsd: "bg-red-900/50 text-red-300 border-red-800",
    unix: "bg-blue-900/50 text-blue-300 border-blue-800",
    windows: "bg-cyan-900/50 text-cyan-300 border-cyan-800",
    other: "bg-zinc-800 text-zinc-300 border-zinc-700",
  };

  const getCompletenessColor = (score: number | null | undefined) => {
    if (!score) return "bg-zinc-700";
    if (score >= 90) return "bg-green-500";
    if (score >= 70) return "bg-yellow-500";
    if (score >= 50) return "bg-orange-500";
    return "bg-red-500";
  };

  const stage = iso.releaseStage || "stable";
  const stageClass = stageColors[stage] || stageColors.stable;
  const osType = iso.distroOsType || "linux";
  const osTypeClass = osTypeColors[osType] || osTypeColors.other;
  const completeness = iso.completenessScore ?? 0;

  return (
    <Link
      className="group flex h-full flex-col rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 transition-all hover:border-zinc-600 hover:bg-zinc-900/70"
      href={`/iso/${iso.id}`}
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold text-white group-hover:text-indigo-300">
            {iso.distroName ? `${iso.distroName} ` : ""}{iso.version}
          </h2>
        </div>
        <span className={`shrink-0 rounded-md border px-2.5 py-1 text-xs font-medium uppercase ${osTypeClass}`}>
          {osType}
        </span>
      </div>

      {/* Metadata Tags */}
      <div className="mb-4 flex flex-1 flex-wrap content-start gap-2">
        {stage !== "stable" && (
          <span className={`rounded-md border px-2 py-1 text-xs font-medium ${stageClass}`}>
            {stage}
          </span>
        )}
        {iso.arch && (
          <span className="rounded-md bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-300">
            {iso.arch}
          </span>
        )}
        {iso.isoType && (
          <span className="rounded-md bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-300">
            {iso.isoType}
          </span>
        )}
        {iso.edition && (
          <span className="rounded-md bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-300">
            {iso.edition}
          </span>
        )}
        {iso.spin && (
          <span className="rounded-md bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-300">
            {iso.spin}
          </span>
        )}
        {iso.initSystem && (
          <span className="rounded-md bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-300">
            {iso.initSystem}
          </span>
        )}
        {iso.hardwareTarget && iso.hardwareTarget !== "generic" && (
          <span className="rounded-md bg-indigo-900/50 px-2 py-1 text-xs font-medium text-indigo-300">
            {iso.hardwareTarget}
          </span>
        )}
      </div>

      {/* Footer - always at bottom */}
      <div className="mt-auto space-y-2 border-t border-zinc-800 pt-3">
        {/* Completeness bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${getCompletenessColor(completeness)} transition-all`}
              style={{ width: `${completeness}%` }}
            />
          </div>
          <span className="text-xs text-zinc-500 w-8 text-right">{completeness}%</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 truncate font-mono text-xs text-zinc-500" title={iso.filename}>
            {iso.filename}
          </p>
          {iso.size && (
            <span className="shrink-0 text-xs text-zinc-400">
              {formatSize(iso.size)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
