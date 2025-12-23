import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { Errors } from "../../../lib/errors";
import { DownloadService } from "../../../services/download";
import type { AppEnv } from "../../../types";

const downloads = new OpenAPIHono<AppEnv>();

// Get direct download link
const directRoute = createRoute({
  method: "get",
  path: "/direct/:id",
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: "Download URL",
      content: {
        "application/json": {
          schema: z.object({
            url: z.string(),
            expiresAt: z.string(),
            filename: z.string(),
          }),
        },
      },
    },
    404: { description: "Not found" },
  },
  tags: ["Downloads"],
});

downloads.openapi(directRoute, async (c) => {
  const { id } = c.req.valid("param");
  const userId = c.get("userId");
  const svc = new DownloadService(c.get("db"));
  const result = await svc.getDirectUrl(Number(id), userId);

  if (!result) {
    throw Errors.NOT_FOUND("ISO");
  }

  return c.json(result);
});

// Get magnet link
const magnetRoute = createRoute({
  method: "get",
  path: "/magnet/:id",
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: "Magnet URI",
      content: {
        "application/json": { schema: z.object({ magnet: z.string() }) },
      },
    },
    404: { description: "Not found" },
  },
  tags: ["Downloads"],
});

downloads.openapi(magnetRoute, async (c) => {
  const { id } = c.req.valid("param");
  const svc = new DownloadService(c.get("db"));
  const result = await svc.getMagnetUri(Number(id));

  if (!result) {
    throw Errors.NOT_FOUND("ISO or checksum not available");
  }

  return c.json(result);
});

// Get torrent file
const torrentRoute = createRoute({
  method: "get",
  path: "/torrent/:id",
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: "Torrent file",
      content: { "application/x-bittorrent": { schema: z.any() } },
    },
    404: { description: "Not found" },
  },
  tags: ["Downloads"],
});

downloads.openapi(torrentRoute, async (c) => {
  const { id } = c.req.valid("param");
  const svc = new DownloadService(c.get("db"));
  const result = await svc.getTorrent(Number(id));

  if (!result) {
    throw Errors.NOT_FOUND("ISO or checksum not available");
  }

  return new Response(result.data, {
    headers: {
      "Content-Type": "application/x-bittorrent",
      "Content-Disposition": `attachment; filename="${result.filename}.torrent"`,
    },
  });
});

export { downloads };
