"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@iso/ui/components/card";
import { Badge } from "@iso/ui/components/badge";
import { Progress } from "@iso/ui/components/progress";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

type BetterOverview = {
  missingChecksums: number;
  missingReleaseDates: number;
  incomplete: number;
  almostComplete: number;
  staging: number;
  flagged: number;
};

type IsoItem = {
  id: number;
  filename: string;
  completenessScore: number | null;
  distroName: string;
};

export default function BetterPage() {
  const [overview, setOverview] = useState<BetterOverview | null>(null);
  const [almostComplete, setAlmostComplete] = useState<IsoItem[]>([]);
  const [missingDates, setMissingDates] = useState<IsoItem[]>([]);
  const [staging, setStaging] = useState<IsoItem[]>([]);
  const [activeTab, setActiveTab] = useState<string>("almost-complete");

  useEffect(() => {
    fetch(`${API_URL}/api/v1/better`)
      .then((r) => r.json())
      .then(setOverview);
    fetch(`${API_URL}/api/v1/better/almost-complete?limit=10`)
      .then((r) => r.json())
      .then(setAlmostComplete);
    fetch(`${API_URL}/api/v1/better/missing-release-dates?limit=10`)
      .then((r) => r.json())
      .then(setMissingDates);
    fetch(`${API_URL}/api/v1/better/staging?limit=10`)
      .then((r) => r.json())
      .then(setStaging);
  }, []);

  const tabs = [
    { id: "almost-complete", label: "Almost Complete", count: overview?.almostComplete, data: almostComplete },
    { id: "missing-dates", label: "Missing Dates", count: overview?.missingReleaseDates, data: missingDates },
    { id: "staging", label: "Needs Review", count: overview?.staging, data: staging },
  ];

  const activeData = tabs.find((t) => t.id === activeTab)?.data || [];

  return (
    <div className="p-8 max-w-6xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white">Better</h1>
        <p className="mt-1 text-zinc-400">
          Help improve the archive. These ISOs need your attention.
        </p>
      </header>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard label="Almost Complete" value={overview?.almostComplete} color="text-green-500" />
        <StatCard label="Missing Dates" value={overview?.missingReleaseDates} color="text-yellow-500" />
        <StatCard label="Missing Checksums" value={overview?.missingChecksums} color="text-orange-500" />
        <StatCard label="Incomplete" value={overview?.incomplete} color="text-red-500" />
        <StatCard label="Needs Review" value={overview?.staging} color="text-blue-500" />
        <StatCard label="Flagged" value={overview?.flagged} color="text-purple-500" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-800 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <Badge variant="secondary" className="ml-2">
                {tab.count}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {/* ISO List */}
      <div className="space-y-2">
        {activeData.map((iso) => (
          <Link key={iso.id} href={`/iso/${iso.id}`}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{iso.filename}</p>
                  <p className="text-sm text-muted-foreground">{iso.distroName}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-24">
                    <Progress value={iso.completenessScore || 0} className="h-2" />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">
                    {iso.completenessScore || 0}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {activeData.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No items in this category. Great job! 🎉
          </p>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value?: number; color: string }) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <p className={`text-2xl font-bold ${color}`}>{value ?? "-"}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
