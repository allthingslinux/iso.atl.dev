"use client";

import { useEffect, useState, useMemo } from "react";
import ReactGridLayout, { useContainerWidth, LayoutItem, verticalCompactor } from "react-grid-layout";
import { GridBackground } from "react-grid-layout/extras";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@iso/ui/components/card";
import { ScrollArea } from "@iso/ui/components/scroll-area";
import { Item, ItemMedia, ItemContent, ItemTitle, ItemGroup } from "@iso/ui/components/item";
import { Badge } from "@iso/ui/components/badge";
import { Progress } from "@iso/ui/components/progress";
import { 
  Database, CheckCircle, Clock, FileEdit, Sparkles, Award, 
  ThumbsUp, AlertTriangle, GripVertical, RotateCcw, Library,
  BarChart3, ChevronRight
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-provider";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

type Overview = {
  isos: { total: number; avgScore: number; verified: number; staging: number; flagged: number };
  distros: number;
  families: number;
  edits: { total: number; pending: number; accepted: number };
  users: { total: number; totalReputation: number };
  badges: { awarded: number };
};

type UserStats = { 
  reputation: number; 
  rank: string; 
  editsSubmitted: number;
  editsApproved: number;
  votesCast: number;
};

const DEFAULT_LAYOUT: LayoutItem[] = [
  { i: "welcome", x: 0, y: 0, w: 12, h: 3 },
  { i: "status", x: 0, y: 3, w: 6, h: 5 },
  { i: "archive", x: 6, y: 3, w: 6, h: 5 },
  { i: "personal", x: 0, y: 8, w: 6, h: 5 },
  { i: "quicklinks", x: 6, y: 8, w: 6, h: 5 },
];

const STORAGE_KEY = "dashboard-layout";

export default function DashboardPage() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [layout, setLayout] = useState<LayoutItem[]>(DEFAULT_LAYOUT);
  const { width, containerRef, mounted } = useContainerWidth({
    initialWidth: 1200
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setLayout(JSON.parse(saved)); } catch {}
    }
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/api/v1/metrics/overview`).then(r => r.json()).then(setOverview);
    if (user?.id) {
      fetch(`${API_URL}/api/v1/curation/users/${user.id}/reputation`)
        .then(r => r.json()).then(setUserStats).catch(() => null);
    }
  }, [user?.id]);

  const onLayoutChange = (newLayout: readonly LayoutItem[]) => {
    if (mounted && newLayout.length > 0) {
      setLayout(newLayout as LayoutItem[]);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newLayout));
    }
  };

  const resetLayout = () => {
    setLayout(DEFAULT_LAYOUT);
    localStorage.removeItem(STORAGE_KEY);
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const COLS = 12;
  const ROW_HEIGHT = 64;
  const MARGIN: [number, number] = [16, 16];
  const GRID_WIDTH = 1200;
  const ROWS = 12;

  if (!mounted) return null;

  return (
    <div className="p-4 w-full min-h-screen flex flex-col bg-zinc-950/20">
      <div className="flex items-center justify-between mb-6 px-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-1 font-medium">Overview of ISO archive and community activity</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={resetLayout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all shadow-lg active:scale-95"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset layout
          </button>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 relative w-full px-2">
        {mounted && (
          <>
            <GridBackground
              width={width - 16} // Account for px-2 padding
              cols={COLS}
              rowHeight={ROW_HEIGHT}
              margin={MARGIN}
              containerPadding={[0, 0]}
              rows={ROWS}
              color="rgba(255,255,255,0.012)"
              borderRadius={8}
              className="absolute inset-0 pointer-events-none"
            />
            
            <ReactGridLayout
              layout={layout}
              width={width - 16}
              gridConfig={{
                cols: COLS,
                rowHeight: ROW_HEIGHT,
                margin: MARGIN,
                containerPadding: [0, 0]
              }}
              dragConfig={{
                enabled: true,
                handle: ".drag-handle",
                bounded: true
              }}
              resizeConfig={{
                enabled: true,
                handles: ["se"]
              }}
              compactor={verticalCompactor}
              onLayoutChange={onLayoutChange}
              className="layout relative z-10"
            >
        {/* Welcome Widget */}
        <div key="welcome" className="overflow-hidden">
          <Widget title="Session Overview">
            <div className="flex items-center justify-between h-full py-1">
              <div className="flex items-center gap-5">
                <div className="h-14 w-14 rounded-xl bg-zinc-800 border border-white/5 flex items-center justify-center shadow-inner shrink-0 bg-linear-to-br from-zinc-800 to-zinc-900">
                  <Sparkles className="h-7 w-7 text-zinc-500" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-extrabold text-white tracking-tight truncate leading-none">
                    {greeting}, {user?.name || "Explorer"}
                  </h2>
                  <p className="text-xs text-zinc-500 mt-1.5 font-medium tracking-tight">Active session in ISO Archive Cloud</p>
                </div>
              </div>
              
              {user && userStats ? (
                <div className="flex items-center gap-6 pr-4 border-l border-white/5 pl-8 ml-4">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1.5">Rank</p>
                    <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 border-white/10 px-2 py-0 text-[10px] font-bold uppercase tabular-nums">
                      {userStats.rank}
                    </Badge>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1.5">Reputation</p>
                    <p className="text-lg font-black text-white leading-none tracking-tighter tabular-nums">{userStats.reputation}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 pr-4 border-l border-white/5 pl-8 ml-4">
                  <button className="px-4 py-2 rounded-lg bg-zinc-800 border border-white/5 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all">
                    Sign in to track progress
                  </button>
                </div>
              )}
            </div>
          </Widget>
        </div>

        {/* Personal Stats Widget */}
        <div key="personal" className="overflow-hidden">
          <Widget title="Your Stats">
            {user && userStats ? (
              <div className="space-y-2">
                <StatLine icon={Award} color="text-amber-500" label="Reputation" value={userStats.reputation} />
                <StatLine icon={FileEdit} color="text-blue-500" label="Edits" value={userStats.editsSubmitted} />
                <StatLine icon={CheckCircle} color="text-green-500" label="Approved" value={userStats.editsApproved} />
                <StatLine icon={ThumbsUp} color="text-purple-500" label="Votes" value={userStats.votesCast ?? 0} />
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-zinc-500">Sign in to track stats</p>
              </div>
            )}
          </Widget>
        </div>

        {/* Archive Stats Widget */}
        <div key="archive" className="overflow-hidden">
          <Widget title="Global Metrics">
            <div className="flex-1 flex flex-col justify-between py-1 h-full">
              <div className="space-y-1">
                <StatLine icon={Database} color="text-zinc-400" label="Total ISOs" value={overview?.isos.total ?? 0} />
                <StatLine icon={Library} color="text-blue-400" label="Distributions" value={overview?.distros ?? 0} />
                <StatLine icon={Sparkles} color="text-amber-400" label="OS Families" value={overview?.families ?? 0} />
                <StatLine icon={Award} color="text-purple-400" label="Badges Awarded" value={overview?.badges.awarded ?? 0} />
              </div>
              <div className="pt-6 mt-auto">
                <div className="flex justify-between text-[10px] uppercase tracking-widest font-black mb-2 px-1">
                  <span className="text-zinc-500">Global Completeness</span>
                  <span className="text-white tabular-nums">{overview?.isos.avgScore ?? 0}%</span>
                </div>
                <Progress value={overview?.isos.avgScore ?? 0} className="h-2 bg-white/5 rounded-full" />
              </div>
            </div>
          </Widget>
        </div>

        {/* Status Widget */}
        <div key="status" className="overflow-hidden">
          <Widget title="Archive Status">
            <div className="grid grid-cols-2 gap-3 h-full">
              <StatusBox icon={CheckCircle} color="text-green-500" bg="bg-green-500/10" value={overview?.isos.verified ?? 0} label="Verified" />
              <StatusBox icon={Clock} color="text-yellow-500" bg="bg-yellow-500/10" value={overview?.isos.staging ?? 0} label="Staging" />
              <StatusBox icon={AlertTriangle} color="text-red-500" bg="bg-red-500/10" value={overview?.isos.flagged ?? 0} label="Flagged" />
              <StatusBox icon={FileEdit} color="text-blue-500" bg="bg-blue-500/10" value={overview?.edits.pending ?? 0} label="Pending" />
            </div>
          </Widget>
        </div>

        {/* Quick Links Widget */}
        <div key="quicklinks" className="overflow-hidden">
          <Widget title="Quick Links">
            <ItemGroup>
              <QuickLink href="/library" icon={Library} label="Browse Library" />
              <QuickLink href="/better" icon={Sparkles} label="Contribute" />
              <QuickLink href="/edits" icon={FileEdit} label="Edit Queue" />
              <QuickLink href="/metrics" icon={BarChart3} label="Metrics" />
            </ItemGroup>
          </Widget>
        </div>
      </ReactGridLayout>
      </>
      )}
      </div>

      <style jsx global>{`
        .react-grid-item {
          transition: none !important;
        }
        .react-grid-item.cssTransforms {
          transition: transform 200ms ease !important;
        }
        .react-grid-item.react-grid-placeholder {
          background: rgba(255, 255, 255, 0.03) !important;
          border: 1px dashed rgba(255, 255, 255, 0.1);
          border-radius: 12px !important;
          opacity: 1 !important;
          z-index: 0 !important;
        }
        .react-grid-item > .react-resizable-handle {
          opacity: 0;
          transition: opacity 0.2s;
        }
        .react-grid-item:hover > .react-resizable-handle {
          opacity: 0.5;
        }
      `}</style>
    </div>
  );
}

function Widget({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="h-full bg-zinc-900 border-white/10 overflow-hidden flex flex-col group shadow-2xl gap-0 py-0 rounded-xl transition-shadow duration-200 hover:shadow-white/5">
      <CardHeader className="px-4 py-2 flex flex-row items-center justify-between border-b border-white/5 bg-zinc-800/30 pb-2">
        <CardTitle className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] leading-none">{title}</CardTitle>
        <CardAction>
          <div className="drag-handle cursor-grab active:cursor-grabbing p-1 rounded hover:bg-white/5 transition-colors">
            <GripVertical className="h-3 w-3 text-zinc-600 hover:text-zinc-400" />
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="p-4 flex-1 overflow-hidden bg-zinc-900/50">
        <ScrollArea className="h-full w-full">
          <div className="min-h-full flex flex-col">
            {children}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function StatLine({ icon: Icon, color, label, value }: { icon: React.ElementType; color: string; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors -mx-1 px-1 rounded">
      <span className="flex items-center gap-3 text-xs text-zinc-400 font-medium">
        <Icon className={`h-4 w-4 ${color}`} />
        {label}
      </span>
      <span className="text-sm font-bold text-white tabular-nums tracking-tighter">{value}</span>
    </div>
  );
}

function StatusBox({ icon: Icon, color, bg, value, label }: { icon: React.ElementType; color: string; bg: string; value: number; label: string }) {
  return (
    <div className={`p-3.5 rounded-xl bg-zinc-800/40 border border-white/5 flex flex-col items-center justify-center transition-all hover:bg-zinc-800/60 hover:border-white/10 group/status shadow-inner`}>
      <div className={`p-2 rounded-lg ${bg} mb-2.5 transition-transform group-hover/status:scale-110`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <p className="text-xl font-black text-white leading-none mb-1.5 tabular-nums tracking-tight">{value}</p>
      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none text-center">{label}</p>
    </div>
  );
}

function QuickLink({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  return (
    <Item asChild size="default" className="hover:bg-zinc-800 cursor-pointer rounded-lg border border-white/5 bg-zinc-900/50 transition-all mb-1 last:mb-0 group/link py-1.5 px-2">
      <Link href={href}>
        <ItemMedia variant="icon" className="size-7 bg-zinc-800 border-white/10 group-hover/link:bg-zinc-700 transition-colors">
          <Icon className="h-3.5 w-3.5 text-zinc-400 group-hover/link:text-zinc-200" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle className="text-[11px] font-bold text-zinc-400 group-hover/link:text-zinc-200 transition-colors uppercase tracking-tight">{label}</ItemTitle>
        </ItemContent>
        <ChevronRight className="h-3 w-3 text-zinc-600 group-hover/link:translate-x-0.5 transition-all" />
      </Link>
    </Item>
  );
}
