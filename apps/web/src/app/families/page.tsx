"use client";

import Link from "next/link";
import { useFamilies } from "@/hooks/use-api";

export default function FamiliesPage() {
  const { data: families, isLoading } = useFamilies();

  return (
    <div className="p-8">
      <h1 className="mb-2 font-bold text-3xl text-white">Families</h1>
      <p className="mb-8 text-sm text-zinc-400">Browse distributions by package family lineage.</p>

      {isLoading ? (
        <div className="text-zinc-500">Loading...</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {families?.map((family) => (
            <Link
              key={family.slug}
              href={`/?family=${family.slug}`}
              className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4 hover:border-zinc-700 hover:bg-zinc-900/50"
            >
              <h2 className="mb-1 font-semibold text-white">{family.name}</h2>
              {family.description && (
                <p className="mb-2 text-sm text-zinc-400">{family.description}</p>
              )}
              <p className="text-xs text-indigo-400">{family.distroCount} distributions</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
