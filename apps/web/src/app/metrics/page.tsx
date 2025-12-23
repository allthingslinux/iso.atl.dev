"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@iso/ui/components/card";
import { Progress } from "@iso/ui/components/progress";
import { 
  Database, HardDrive, FolderTree, FileEdit, Users, Award,
  ChevronRight, ChevronDown, CheckCircle, AlertCircle, Clock
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

type TreeNode = {
  osType: string;
  isoCount: number;
  avgScore: number;
  complete: number;
  distros: Array<{
    id: number;
    name: string;
    slug: string;
    isoCount: number;
    avgScore: number;
    complete: number;
  }>;
};

type Overview = {
  isos: { total: number; avgScore: number; complete: number; verified: number; staging: number; flagged: number };
  distros: number;
  families: number;
  edits: { total: number; pending: number; accepted: number; rejected: number };
  users: { total: number; totalReputation: number; totalEdits: number };
  badges: { awarded: number };
};

export default function MetricsPage() {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch(`${API_URL}/api/v1/metrics/tree`).then(r => r.json()).then(setTree);
    fetch(`${API_URL}/api/v1/metrics/overview`).then(r => r.json()).then(setOverview);
  }, []);

  const toggle = (slug: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });
  };

  const scoreColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 70) return "text-yellow-400";
    if (score >= 50) return "text-orange-400";
    return "text-red-400";
  };

  return (
    <div className="p-8 max-w-6xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white">Metrics</h1>
        <p className="mt-1 text-zinc-400">Database statistics and completeness overview</p>
      </header>

      {/* Overview Cards */}
      {overview?.isos && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<HardDrive />} label="Total ISOs" value={overview.isos.total} />
          <StatCard icon={<FolderTree />} label="Distros" value={overview.distros} />
          <StatCard icon={<Database />} label="Families" value={overview.families} />
          <StatCard 
            icon={<CheckCircle />} 
            label="Avg Completeness" 
            value={`${overview.isos.avgScore}%`}
            color={scoreColor(overview.isos.avgScore)}
          />
        </div>
      )}

      {/* Status Breakdown */}
      {overview?.isos && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-zinc-400">Verified</span>
                </div>
                <span className="text-xl font-bold text-green-400">{overview.isos.verified}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-zinc-400">Staging</span>
                </div>
                <span className="text-xl font-bold text-yellow-400">{overview.isos.staging}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-zinc-400">Flagged</span>
                </div>
                <span className="text-xl font-bold text-red-400">{overview.isos.flagged}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Community Stats */}
      {overview?.edits && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<FileEdit />} label="Total Edits" value={overview.edits.total} />
          <StatCard icon={<Clock />} label="Pending Edits" value={overview.edits.pending} color="text-yellow-400" />
          <StatCard icon={<Users />} label="Contributors" value={overview.users.total} />
          <StatCard icon={<Award />} label="Badges Awarded" value={overview.badges.awarded} />
        </div>
      )}

      {/* Completeness Tree */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Completeness by OS Type</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Header */}
          <div className="flex items-center gap-2 p-2 mb-2 border-b border-zinc-800 text-xs text-zinc-500 font-medium">
            <span className="w-4" />
            <span className="flex-1">OS Type</span>
            <span className="w-16 text-right mr-4">ISOs</span>
            <span className="w-12 text-right">Score</span>
            <span className="w-24" />
          </div>
          <div className="space-y-1">
            {tree.map(osType => (
              <div key={osType.osType}>
                <button
                  onClick={() => toggle(osType.osType)}
                  className="w-full flex items-center gap-2 p-2 rounded hover:bg-zinc-800/50 transition-colors"
                >
                  {osType.distros.length > 0 ? (
                    expanded.has(osType.osType) ? (
                      <ChevronDown className="h-4 w-4 text-zinc-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-zinc-500" />
                    )
                  ) : (
                    <span className="w-4" />
                  )}
                  <span className="font-medium text-white flex-1 text-left capitalize">{osType.osType}</span>
                  <span className="text-xs text-zinc-500 w-16 text-right mr-4">{osType.isoCount}</span>
                  <span className={`text-sm font-mono w-12 text-right ${scoreColor(osType.avgScore)}`}>
                    {osType.avgScore}%
                  </span>
                  <Progress value={osType.avgScore} className="w-24 h-2" />
                </button>

                {expanded.has(osType.osType) && osType.distros.length > 0 && (
                  <div className="ml-6 border-l border-zinc-800 pl-4">
                    {/* Distro Header */}
                    <div className="flex items-center gap-2 p-2 mb-1 text-xs text-zinc-600 font-medium">
                      <span className="flex-1">Distribution</span>
                      <span className="w-20 text-right mr-4">Complete</span>
                      <span className="w-12 text-right">Score</span>
                      <span className="w-24" />
                    </div>
                    <div className="space-y-1">
                      {osType.distros.map(distro => (
                        <div
                          key={distro.slug}
                          className="flex items-center gap-2 p-2 rounded hover:bg-zinc-800/30"
                        >
                          <span className="text-zinc-300 flex-1">{distro.name}</span>
                          <span className="text-xs text-zinc-500 w-20 text-right mr-4">
                            {distro.complete}/{distro.isoCount}
                          </span>
                          <span className={`text-sm font-mono w-12 text-right ${scoreColor(distro.avgScore)}`}>
                            {distro.avgScore}%
                          </span>
                          <Progress value={distro.avgScore} className="w-24 h-2" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ 
  icon, label, value, color = "text-white" 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string | number;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="text-zinc-500">{icon}</div>
          <div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-zinc-500">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
