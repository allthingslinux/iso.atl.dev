"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useDistributions } from "@/hooks/use-api";

export default function DistrosPage() {
  const { data: distros, isLoading } = useDistributions();

  return (
    <div className="p-8">
      <h1 className="mb-2 font-bold text-3xl text-white">Distributions</h1>
      <p className="mb-8 text-sm text-zinc-400">Browse all Linux distributions in the archive.</p>

      {isLoading ? (
        <div className="text-zinc-500">Loading...</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {distros?.map((distro) => (
            <Link
              key={distro.slug}
              href={`/distro/${distro.slug}`}
              className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4 hover:border-zinc-700 hover:bg-zinc-900/50"
            >
              <div className="mb-1 flex items-center justify-between">
                <h2 className="font-semibold text-white">{distro.name}</h2>
                <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                  {distro.osType}
                </span>
              </div>
              {distro.familyName && (
                <p className="mb-2 text-xs text-indigo-400">{distro.familyName}</p>
              )}
              <p className="text-sm text-zinc-500">{distro.isoCount} ISOs</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
