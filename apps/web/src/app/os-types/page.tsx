"use client";

import Link from "next/link";

const OS_TYPES = [
  { slug: "linux", name: "Linux", description: "Linux-based operating systems", icon: "🐧" },
  { slug: "bsd", name: "BSD", description: "Berkeley Software Distribution variants", icon: "😈" },
  { slug: "unix", name: "Unix", description: "Traditional Unix systems", icon: "🖥️" },
  { slug: "vintage", name: "Vintage", description: "Legacy and historical systems", icon: "📼" },
  { slug: "other", name: "Other", description: "Experimental and alternative systems", icon: "🔬" },
  { slug: "mobile", name: "Mobile", description: "Mobile operating systems", icon: "📱" },
  { slug: "windows", name: "Windows", description: "Windows releases", icon: "🪟" },
];

export default function OsTypesPage() {
  return (
    <div className="p-8">
      <h1 className="mb-2 font-bold text-3xl text-white">OS Types</h1>
      <p className="mb-8 text-sm text-zinc-400">Browse by operating system type.</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {OS_TYPES.map((osType) => (
          <Link
            key={osType.slug}
            href={`/?osType=${osType.slug}`}
            className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4 hover:border-zinc-700 hover:bg-zinc-900/50"
          >
            <div className="mb-2 text-3xl">{osType.icon}</div>
            <h2 className="mb-1 font-semibold text-white">{osType.name}</h2>
            <p className="text-sm text-zinc-400">{osType.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
