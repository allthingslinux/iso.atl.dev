"use client";

import { Button } from "@iso/ui/components/ui/button";
import { Input } from "@iso/ui/components/ui/input";
import { keepPreviousData } from "@tanstack/react-query";
import { Library, RefreshCw } from "lucide-react";
import { useQueryState } from "nuqs";
import { Suspense, useState } from "react";
import { trpc } from "@/trpc/client";

function SearchPageContent() {
  const [query, setQuery] = useQueryState("q", { defaultValue: "" });
  const [searchInput, setSearchInput] = useState(query);

  const { data: results, isLoading } = trpc.search.useQuery(
    { q: query },
    { placeholderData: keepPreviousData }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(searchInput);
  };

  return (
    <div className="p-8">
      <header className="mb-10">
        <h1 className="mb-2 font-bold text-3xl text-white tracking-tight">
          The Great Library
        </h1>
        <p className="text-sm text-zinc-400">
          Discover and browse verified Linux ISOs from the community.
        </p>

        <div className="mt-8 flex max-w-2xl">
          <form className="flex w-full space-x-2" onSubmit={handleSearch}>
            <div className="relative flex-1">
              <Input
                className="border-zinc-800 bg-zinc-900/50 pl-10 text-white transition-all focus:border-indigo-500/50 focus:ring-indigo-500/50"
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search ISOs (Ubuntu, Arch, Debian...)"
                value={searchInput}
              />
              <Library className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            </div>
            <Button
              className="bg-indigo-600 hover:bg-indigo-500"
              type="submit"
              variant="default"
            >
              Search
            </Button>
          </form>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {!!isLoading && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-zinc-500">
            <RefreshCw className="mb-4 h-10 w-10 animate-spin text-indigo-500/50" />
            <p className="font-medium">Curating your library...</p>
          </div>
        )}

        {results?.map((iso) => (
          <div
            className="group relative flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 transition-all hover:border-zinc-700/50 hover:bg-zinc-900/50 hover:shadow-2xl hover:shadow-indigo-500/5"
            key={iso.id}
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[10px] text-indigo-400 uppercase tracking-widest">
                    {iso.distroSlug || "Linux"}
                  </span>
                </div>
                <h2 className="font-bold text-lg text-zinc-100 transition-colors group-hover:text-white">
                  {iso.distroName} {iso.version}
                </h2>
              </div>
              <span className="rounded-full border border-zinc-700/50 bg-zinc-800/80 px-2.5 py-0.5 font-medium text-[10px] text-zinc-300">
                {iso.arch}
              </span>
            </div>

            <p
              className="mb-6 line-clamp-2 font-mono text-xs text-zinc-500 italic leading-relaxed"
              title={iso.filename}
            >
              {iso.filename}
            </p>

            <div className="mt-auto flex items-center justify-between border-zinc-800/50 border-t pt-4">
              <Button
                className="h-8 border-none bg-zinc-800 px-4 text-xs text-zinc-100 hover:bg-zinc-700"
                size="sm"
                variant="outline"
              >
                Inspect
              </Button>
              <span className="font-mono text-[10px] text-zinc-600 tabular-nums tracking-tighter">
                REF: #{iso.id}
              </span>
            </div>
          </div>
        ))}

        {results?.length === 0 && !isLoading && (
          <div className="col-span-full rounded-2xl border-2 border-zinc-800/50 border-dashed py-20 text-center">
            <p className="mb-2 text-zinc-500">
              No volumes found in the archives
            </p>
            <p className="text-xs text-zinc-600 italic">
              Try searching for "{query}" in another archive
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
          Loading Great Library...
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
