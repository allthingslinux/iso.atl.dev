import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { distros, isos } from "@iso/db";
import { count, eq, isNull, lt, sql } from "drizzle-orm";
import type { AppEnv } from "../../../types";

const better = new OpenAPIHono<AppEnv>();

// Get contribution opportunities overview
const overviewRoute = createRoute({
  method: "get",
  path: "/",
  responses: {
    200: {
      description: "Contribution opportunities overview",
      content: {
        "application/json": {
          schema: z.object({
            missingChecksums: z.number(),
            missingReleaseDates: z.number(),
            incomplete: z.number(),
            almostComplete: z.number(),
            staging: z.number(),
            flagged: z.number(),
          }),
        },
      },
    },
  },
  tags: ["Better"],
});

better.openapi(overviewRoute, async (c) => {
  const db = c.get("db");

  const [
    [{ missingChecksums }],
    [{ missingReleaseDates }],
    [{ incomplete }],
    [{ almostComplete }],
    [{ staging }],
    [{ flagged }],
  ] = await Promise.all([
    db.select({ missingChecksums: count() }).from(isos).where(isNull(isos.checksumSha256)),
    db.select({ missingReleaseDates: count() }).from(isos).where(isNull(isos.releaseDate)),
    db.select({ incomplete: count() }).from(isos).where(lt(isos.completenessScore, 50)),
    db.select({ almostComplete: count() }).from(isos).where(sql`${isos.completenessScore} BETWEEN 80 AND 99`),
    db.select({ staging: count() }).from(isos).where(eq(isos.status, "staging")),
    db.select({ flagged: count() }).from(isos).where(eq(isos.status, "flagged")),
  ]);

  return c.json({
    missingChecksums,
    missingReleaseDates,
    incomplete,
    almostComplete,
    staging,
    flagged,
  });
});

// Get ISOs missing checksums
const missingChecksumsRoute = createRoute({
  method: "get",
  path: "/missing-checksums",
  request: {
    query: z.object({ limit: z.coerce.number().default(50) }),
  },
  responses: {
    200: {
      description: "ISOs missing SHA256 checksum",
      content: { "application/json": { schema: z.array(z.any()) } },
    },
  },
  tags: ["Better"],
});

better.openapi(missingChecksumsRoute, async (c) => {
  const { limit } = c.req.valid("query");
  const db = c.get("db");

  const results = await db
    .select({
      id: isos.id,
      filename: isos.filename,
      completenessScore: isos.completenessScore,
      distroName: distros.name,
    })
    .from(isos)
    .innerJoin(distros, eq(isos.distroId, distros.id))
    .where(isNull(isos.checksumSha256))
    .limit(limit);

  return c.json(results);
});

// Get ISOs missing release dates
const missingReleaseDatesRoute = createRoute({
  method: "get",
  path: "/missing-release-dates",
  request: {
    query: z.object({ limit: z.coerce.number().default(50) }),
  },
  responses: {
    200: {
      description: "ISOs missing release date",
      content: { "application/json": { schema: z.array(z.any()) } },
    },
  },
  tags: ["Better"],
});

better.openapi(missingReleaseDatesRoute, async (c) => {
  const { limit } = c.req.valid("query");
  const db = c.get("db");

  const results = await db
    .select({
      id: isos.id,
      filename: isos.filename,
      completenessScore: isos.completenessScore,
      distroName: distros.name,
    })
    .from(isos)
    .innerJoin(distros, eq(isos.distroId, distros.id))
    .where(isNull(isos.releaseDate))
    .limit(limit);

  return c.json(results);
});

// Get almost complete ISOs (80-99%)
const almostCompleteRoute = createRoute({
  method: "get",
  path: "/almost-complete",
  request: {
    query: z.object({ limit: z.coerce.number().default(50) }),
  },
  responses: {
    200: {
      description: "ISOs at 80-99% completeness",
      content: { "application/json": { schema: z.array(z.any()) } },
    },
  },
  tags: ["Better"],
});

better.openapi(almostCompleteRoute, async (c) => {
  const { limit } = c.req.valid("query");
  const db = c.get("db");

  const results = await db
    .select({
      id: isos.id,
      filename: isos.filename,
      completenessScore: isos.completenessScore,
      distroName: distros.name,
    })
    .from(isos)
    .innerJoin(distros, eq(isos.distroId, distros.id))
    .where(sql`${isos.completenessScore} BETWEEN 80 AND 99`)
    .orderBy(sql`${isos.completenessScore} DESC`)
    .limit(limit);

  return c.json(results);
});

// Get staging ISOs needing review
const stagingRoute = createRoute({
  method: "get",
  path: "/staging",
  request: {
    query: z.object({ limit: z.coerce.number().default(50) }),
  },
  responses: {
    200: {
      description: "ISOs in staging status",
      content: { "application/json": { schema: z.array(z.any()) } },
    },
  },
  tags: ["Better"],
});

better.openapi(stagingRoute, async (c) => {
  const { limit } = c.req.valid("query");
  const db = c.get("db");

  const results = await db
    .select({
      id: isos.id,
      filename: isos.filename,
      completenessScore: isos.completenessScore,
      distroName: distros.name,
    })
    .from(isos)
    .innerJoin(distros, eq(isos.distroId, distros.id))
    .where(eq(isos.status, "staging"))
    .limit(limit);

  return c.json(results);
});

export { better };
