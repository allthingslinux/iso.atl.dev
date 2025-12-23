"use client";

import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useDistro, useSearch } from "@/hooks/use-api";
import { IsoCard } from "@/components/iso-card";

export default function DistroDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: distro, isLoading } = useDistro(slug);
  const { data: isosData } = useSearch({ distro: slug, limit: 20 });

  if (isLoading) {
    return <div className="p-8 text-zinc-400">Loading...</div>;
  }

  if (!distro) {
    return <div className="p-8 text-zinc-400">Distribution not found</div>;
  }

  const isos = isosData?.results ?? [];

  return (
    <div className="p-8">
      <Link
        className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white"
        href="/"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to search
      </Link>

      <div className="mb-8 flex items-start gap-6">
        {distro.logoUrl ? (
          <img
            alt={distro.name}
            className="h-20 w-20 rounded-lg"
            src={distro.logoUrl}
          />
        ) : null}
        <div>
          <div className="mb-1 flex items-center gap-2">
            {distro.family ? (
              <span className="text-indigo-400 text-sm">
                {distro.family.name}
              </span>
            ) : null}
            <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
              {distro.osType}
            </span>
          </div>
          <h1 className="mb-2 font-bold text-3xl text-white">{distro.name}</h1>
          {distro.description ? (
            <p className="max-w-2xl text-zinc-400">{distro.description}</p>
          ) : null}
          {distro.website ? (
            <a
              className="mt-2 inline-flex items-center gap-1 text-indigo-400 text-sm hover:text-indigo-300"
              href={distro.website}
              rel="noreferrer"
              target="_blank"
            >
              {distro.website}
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
        </div>
      </div>

      {distro.parent ? (
        <div className="mb-6">
          <span className="text-sm text-zinc-500">Based on: </span>
          <Link
            className="text-indigo-400 text-sm hover:text-indigo-300"
            href={`/distro/${distro.parent.slug}`}
          >
            {distro.parent.name}
          </Link>
        </div>
      ) : null}

      {distro.children?.length > 0 ? (
        <div className="mb-8">
          <h2 className="mb-3 font-semibold text-white">Derivatives</h2>
          <div className="flex flex-wrap gap-2">
            {distro.children.map((child: { slug: string; name: string }) => (
              <Link
                className="rounded-full bg-zinc-800 px-3 py-1 text-sm text-zinc-300 hover:bg-zinc-700"
                href={`/distro/${child.slug}`}
                key={child.slug}
              >
                {child.name}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <h2 className="mb-4 font-semibold text-white">
          Available ISOs ({distro.isoCount})
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {isos.map((iso) => (
            <IsoCard key={iso.id} iso={{ ...iso, familyName: undefined }} />
          ))}
        </div>
      </div>
    </div>
  );
}
