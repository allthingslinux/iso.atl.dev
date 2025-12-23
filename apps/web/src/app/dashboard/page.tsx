"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@iso/ui/components/card";
import { Badge } from "@iso/ui/components/badge";
import { Button } from "@iso/ui/components/button";
import { 
  Database, 
  Download, 
  Users, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  ArrowRight,
  FileCheck,
  AlertTriangle,
  Activity
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/dev-auth";
import { useSearch, useFamilies, useDistributions } from "@/hooks/use-api";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: allIsos } = useSearch({ limit: 1000 });
  const { data: pendingIsos } = useSearch({ status: "pending", limit: 100 });
  const { data: families } = useFamilies();
  const { data: distros } = useDistributions();

  const totalIsos = allIsos?.total ?? 0;
  const pendingCount = pendingIsos?.total ?? 0;
  const verifiedCount = allIsos?.results?.filter(i => i.status === "verified").length ?? 0;
  const familyCount = families?.length ?? 0;
  const distroCount = distros?.length ?? 0;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const recentActivity = [
    { type: "verified", message: "Ubuntu 24.04 LTS verified", time: "2 hours ago", icon: CheckCircle2, color: "text-emerald-400" },
    { type: "added", message: "Fedora 41 KDE Spin added", time: "5 hours ago", icon: Database, color: "text-blue-400" },
    { type: "flagged", message: "EndeavourOS Galileo flagged for review", time: "1 day ago", icon: AlertTriangle, color: "text-amber-400" },
    { type: "verified", message: "Debian 12.4 netinst verified", time: "2 days ago", icon: CheckCircle2, color: "text-emerald-400" },
    { type: "added", message: "Void Linux musl variant added", time: "3 days ago", icon: Database, color: "text-blue-400" },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          {greeting()}, {user.username}
        </h1>
        <p className="mt-1 text-zinc-400">
          Here's what's happening with the ISO Archive today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total ISOs</CardTitle>
            <Database className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalIsos}</div>
            <p className="text-xs text-zinc-500">Across {distroCount} distributions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Verified</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{verifiedCount}</div>
            <p className="text-xs text-zinc-500">
              {totalIsos > 0 ? Math.round((verifiedCount / totalIsos) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{pendingCount}</div>
            <p className="text-xs text-zinc-500">Awaiting verification</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Families</CardTitle>
            <Users className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{familyCount}</div>
            <p className="text-xs text-zinc-500">Distribution families</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Activity Feed */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest updates to the archive</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`mt-0.5 ${item.color}`}>
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-200">{item.message}</p>
                    <p className="text-xs text-zinc-500">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild variant="outline" className="w-full justify-between">
              <Link href="/library">
                Browse Library
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-between">
              <Link href="/staging">
                Review Staging
                <Badge variant="secondary" className="ml-2">{pendingCount}</Badge>
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-between">
              <Link href="/sync">
                Sync Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Your Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Your Contributions</CardTitle>
            <CardDescription>Your curation activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Reputation</span>
                <span className="font-semibold text-indigo-400">{user.reputation}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Role</span>
                <Badge variant="outline" className="capitalize">{user.role}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Edits Submitted</span>
                <span className="text-zinc-200">12</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Edits Approved</span>
                <span className="text-zinc-200">10</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Distributions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Popular Distributions</CardTitle>
            <CardDescription>Most ISOs by distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {distros?.slice(0, 5).map((distro) => (
                <div key={distro.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-800 text-sm font-medium text-zinc-300">
                      {distro.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-200">{distro.name}</p>
                      <p className="text-xs text-zinc-500">{distro.familyName || "Independent"}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{distro.isoCount} ISOs</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
