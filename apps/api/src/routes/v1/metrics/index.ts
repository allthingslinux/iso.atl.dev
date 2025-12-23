import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { families, distros, isos, edits, profiles, userBadges } from "@iso/db";
import { count, eq, sql } from "drizzle-orm";
import type { AppEnv } from "../../../types";

const metrics = new OpenAPIHono<AppEnv>();

// Tree structure: os_type -> distros -> iso counts/scores
const treeRoute = createRoute({
  method: "get",
  path: "/tree",
  responses: {
    200: {
      description: "Nested completeness tree",
      content: { "application/json": { schema: z.any() } },
    },
  },
  tags: ["Metrics"],
});

const ALL_OS_TYPES = ["linux", "bsd", "unix", "vintage", "other", "mobile", "windows"] as const;

metrics.openapi(treeRoute, async (c) => {
  const db = c.get("db");

  // Get all distros with their os_type and iso stats
  const data = await db
    .select({
      osType: distros.osType,
      distroId: distros.id,
      distroName: distros.name,
      distroSlug: distros.slug,
      isoCount: sql<number>`count(${isos.id})::int`,
      avgScore: sql<number>`coalesce(avg(${isos.completenessScore}), 0)::int`,
      complete: sql<number>`count(case when ${isos.completenessScore} = 100 then 1 end)::int`,
    })
    .from(distros)
    .leftJoin(isos, eq(isos.distroId, distros.id))
    .groupBy(distros.osType, distros.id, distros.name, distros.slug);

  // Initialize all OS types
  const tree: Record<string, {
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
  }> = {};

  for (const osType of ALL_OS_TYPES) {
    tree[osType] = { osType, isoCount: 0, avgScore: 0, complete: 0, distros: [] };
  }

  for (const row of data) {
    const osType = row.osType || "other";
    tree[osType].distros.push({
      id: row.distroId,
      name: row.distroName,
      slug: row.distroSlug,
      isoCount: row.isoCount,
      avgScore: row.avgScore,
      complete: row.complete,
    });
    tree[osType].isoCount += row.isoCount;
    tree[osType].complete += row.complete;
  }

  // Calculate OS type avg scores
  for (const osType of Object.values(tree)) {
    if (osType.distros.length > 0) {
      const totalIsos = osType.distros.reduce((s, d) => s + d.isoCount, 0);
      const weightedSum = osType.distros.reduce((s, d) => s + d.avgScore * d.isoCount, 0);
      osType.avgScore = totalIsos > 0 ? Math.round(weightedSum / totalIsos) : 0;
    }
    osType.distros.sort((a, b) => b.isoCount - a.isoCount);
  }

  // Sort: ones with ISOs first (by count), then empty ones alphabetically
  return c.json(
    Object.values(tree).sort((a, b) => {
      if (a.isoCount === 0 && b.isoCount === 0) return a.osType.localeCompare(b.osType);
      if (a.isoCount === 0) return 1;
      if (b.isoCount === 0) return -1;
      return b.isoCount - a.isoCount;
    })
  );
});

// Overview stats
const overviewRoute = createRoute({
  method: "get",
  path: "/overview",
  responses: {
    200: {
      description: "Database overview metrics",
      content: { "application/json": { schema: z.any() } },
    },
  },
  tags: ["Metrics"],
});

metrics.openapi(overviewRoute, async (c) => {
  const db = c.get("db");

  const [
    [isoStats],
    [distroCount],
    [familyCount],
    [editStats],
    [userStats],
    [badgeStats],
  ] = await Promise.all([
    db.select({
      total: count(),
      avgScore: sql<number>`coalesce(avg(${isos.completenessScore}), 0)::int`,
      complete: sql<number>`count(case when ${isos.completenessScore} = 100 then 1 end)::int`,
      verified: sql<number>`count(case when ${isos.status} = 'verified' then 1 end)::int`,
      staging: sql<number>`count(case when ${isos.status} = 'staging' then 1 end)::int`,
      flagged: sql<number>`count(case when ${isos.status} = 'flagged' then 1 end)::int`,
    }).from(isos),
    db.select({ count: count() }).from(distros),
    db.select({ count: count() }).from(families),
    db.select({
      total: count(),
      pending: sql<number>`count(case when ${edits.status} = 'pending' then 1 end)::int`,
      accepted: sql<number>`count(case when ${edits.status} in ('accepted', 'immediate_accepted') then 1 end)::int`,
      rejected: sql<number>`count(case when ${edits.status} in ('rejected', 'immediate_rejected') then 1 end)::int`,
    }).from(edits),
    db.select({
      total: count(),
      totalReputation: sql<number>`coalesce(sum(${profiles.reputation}), 0)::int`,
      totalEdits: sql<number>`coalesce(sum(${profiles.editsApproved}), 0)::int`,
    }).from(profiles),
    db.select({ awarded: count() }).from(userBadges),
  ]);

  return c.json({
    isos: isoStats,
    distros: distroCount.count,
    families: familyCount.count,
    edits: editStats,
    users: userStats,
    badges: badgeStats,
  });
});

export { metrics };
