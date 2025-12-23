"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@iso/ui/components/card";
import { Badge } from "@iso/ui/components/badge";
import { Progress } from "@iso/ui/components/progress";
import { useAuth } from "@/lib/auth-provider";
import { BadgeList } from "@/components/user-badges";
import { FileEdit, ThumbsUp, Award, TrendingUp } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

type Reputation = {
  reputation: number;
  rank: string;
  editsSubmitted: number;
  editsApproved: number;
};

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const [reputation, setReputation] = useState<Reputation | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`${API_URL}/api/v1/curation/users/${user.id}/reputation`)
      .then((r) => r.json())
      .then(setReputation)
      .catch(() => setReputation(null));
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-zinc-800 rounded" />
          <div className="h-4 w-64 bg-zinc-800 rounded" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 max-w-4xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white">Profile</h1>
          <p className="mt-1 text-zinc-400">Sign in to view your profile.</p>
        </header>
      </div>
    );
  }

  const rankColors: Record<string, string> = {
    viewer: "bg-zinc-500/20 text-zinc-400",
    contributor: "bg-green-500/20 text-green-400",
    curator: "bg-blue-500/20 text-blue-400",
    trusted: "bg-purple-500/20 text-purple-400",
  };

  const approvalRate = reputation?.editsSubmitted
    ? Math.round((reputation.editsApproved / reputation.editsSubmitted) * 100)
    : 0;

  return (
    <div className="p-8 max-w-4xl">
      <header className="mb-8">
        <div className="flex items-center gap-4">
          {user.image ? (
            <img src={user.image} alt={user.name} className="h-16 w-16 rounded-full" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600 text-2xl font-bold text-white">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-white">{user.name}</h1>
            <p className="text-zinc-400">{user.email}</p>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Reputation"
          value={reputation?.reputation ?? 0}
        />
        <StatCard
          icon={<FileEdit className="h-5 w-5" />}
          label="Edits Submitted"
          value={reputation?.editsSubmitted ?? 0}
        />
        <StatCard
          icon={<ThumbsUp className="h-5 w-5" />}
          label="Edits Approved"
          value={reputation?.editsApproved ?? 0}
        />
        <StatCard
          icon={<Award className="h-5 w-5" />}
          label="Approval Rate"
          value={`${approvalRate}%`}
        />
      </div>

      {/* Rank */}
      {reputation && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Rank</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Badge className={`text-sm px-3 py-1 ${rankColors[reputation.rank] || rankColors.viewer}`}>
                {reputation.rank}
              </Badge>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-400">Progress to next rank</span>
                  <span className="text-zinc-300">{reputation.editsApproved} / {getNextRankThreshold(reputation.rank)}</span>
                </div>
                <Progress 
                  value={(reputation.editsApproved / getNextRankThreshold(reputation.rank)) * 100} 
                  className="h-2" 
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Badges</CardTitle>
        </CardHeader>
        <CardContent>
          <BadgeList userId={user.id} />
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="text-zinc-500">{icon}</div>
          <div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-zinc-500">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getNextRankThreshold(rank: string): number {
  switch (rank) {
    case "viewer": return 1;
    case "contributor": return 10;
    case "curator": return 50;
    case "trusted": return 100;
    default: return 100;
  }
}
