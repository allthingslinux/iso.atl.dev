import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { Errors } from "../../../lib/errors";
import { LibraryService } from "../../../services/library";
import type { AppEnv } from "../../../types";

const library = new OpenAPIHono<AppEnv>();

// Get ISO by ID
const getIsoRoute = createRoute({
  method: "get",
  path: "/isos/:id",
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: "ISO details",
      content: { "application/json": { schema: z.any() } },
    },
    404: { description: "Not found" },
  },
  tags: ["Library"],
});

library.openapi(getIsoRoute, async (c) => {
  const { id } = c.req.valid("param");
  const svc = new LibraryService(c.get("db"));
  const iso = await svc.getIso(Number(id));
  if (!iso) {
    throw Errors.NOT_FOUND("ISO");
  }
  return c.json(iso);
});

// Get ISO fingerprint/checksums
const fingerprintRoute = createRoute({
  method: "get",
  path: "/isos/:id/fingerprint",
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: "ISO checksums",
      content: {
        "application/json": {
          schema: z.object({
            md5: z.string().nullable(),
            sha1: z.string().nullable(),
            sha256: z.string().nullable(),
          }),
        },
      },
    },
    404: { description: "Not found" },
  },
  tags: ["Library"],
});

library.openapi(fingerprintRoute, async (c) => {
  const { id } = c.req.valid("param");
  const svc = new LibraryService(c.get("db"));
  const fp = await svc.getFingerprint(Number(id));
  if (!fp) {
    throw Errors.NOT_FOUND("ISO");
  }
  return c.json(fp);
});

// Get distro by slug
const getDistroRoute = createRoute({
  method: "get",
  path: "/distros/:slug",
  request: {
    params: z.object({ slug: z.string() }),
  },
  responses: {
    200: {
      description: "Distribution details with family, parent, children",
      content: { "application/json": { schema: z.any() } },
    },
    404: { description: "Not found" },
  },
  tags: ["Library"],
});

library.openapi(getDistroRoute, async (c) => {
  const { slug } = c.req.valid("param");
  const svc = new LibraryService(c.get("db"));
  const distro = await svc.getDistro(slug);
  if (!distro) {
    throw Errors.NOT_FOUND("Distribution");
  }
  return c.json(distro);
});

export { library };
