import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { Errors } from "../../../lib/errors";
import { CurationService } from "../../../services/curation.service";
import type { AppEnv } from "../../../types";

const curation = new OpenAPIHono<AppEnv>();

const operationEnum = z.enum(["create", "modify", "destroy"]);
const editStatusEnum = z.enum(["pending", "accepted", "rejected", "immediate_accepted", "immediate_rejected", "failed", "canceled"]);
const voteEnum = z.enum(["accept", "reject", "abstain", "immediate_accept", "immediate_reject"]);

// Submit edit
const submitEditRoute = createRoute({
  method: "post",
  path: "/edits",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            targetType: z.enum(["iso", "distro", "family"]),
            targetId: z.string().optional(),
            operation: operationEnum,
            data: z.record(z.string(), z.unknown()),
            comment: z.string().optional(),
            automation: z.boolean().optional(),
            automationSource: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Edit created",
      content: { "application/json": { schema: z.object({ id: z.string() }) } },
    },
  },
  tags: ["Curation"],
});

curation.openapi(submitEditRoute, async (c) => {
  const body = c.req.valid("json");
  const userId = c.get("userId") ?? "anonymous";
  const svc = new CurationService(c.get("db"));

  const edit = await svc.submitEdit({
    userId,
    targetType: body.targetType,
    targetId: body.targetId,
    operation: body.operation,
    newData: body.data,
    comment: body.comment,
    automation: body.automation,
    automationSource: body.automationSource,
  });

  return c.json({ id: edit.id });
});

// Update pending edit
const updateEditRoute = createRoute({
  method: "patch",
  path: "/edits/:id",
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            data: z.record(z.string(), z.unknown()),
            comment: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Edit updated",
      content: { "application/json": { schema: z.any() } },
    },
  },
  tags: ["Curation"],
});

curation.openapi(updateEditRoute, async (c) => {
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");
  const userId = c.get("userId") ?? "anonymous";
  const svc = new CurationService(c.get("db"));

  const edit = await svc.updateEdit(id, userId, body.data, body.comment);
  return c.json(edit);
});

// List edits
const listEditsRoute = createRoute({
  method: "get",
  path: "/edits",
  request: {
    query: z.object({
      status: editStatusEnum.optional(),
      page: z.coerce.number().default(1),
      limit: z.coerce.number().default(20),
    }),
  },
  responses: {
    200: {
      description: "Edit list",
      content: {
        "application/json": {
          schema: z.object({
            items: z.array(z.any()),
            total: z.number(),
            page: z.number(),
            limit: z.number(),
          }),
        },
      },
    },
  },
  tags: ["Curation"],
});

curation.openapi(listEditsRoute, async (c) => {
  const { status, page, limit } = c.req.valid("query");
  const svc = new CurationService(c.get("db"));
  return c.json(await svc.listEdits(status, page, limit));
});

// Get single edit
const getEditRoute = createRoute({
  method: "get",
  path: "/edits/:id",
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      description: "Edit details with votes and comments",
      content: { "application/json": { schema: z.any() } },
    },
    404: { description: "Not found" },
  },
  tags: ["Curation"],
});

curation.openapi(getEditRoute, async (c) => {
  const { id } = c.req.valid("param");
  const svc = new CurationService(c.get("db"));
  const edit = await svc.getEdit(id);

  if (!edit) {
    throw Errors.NOT_FOUND("Edit");
  }

  return c.json(edit);
});

// Vote on edit
const voteRoute = createRoute({
  method: "post",
  path: "/edits/:id/votes",
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        "application/json": {
          schema: z.object({ vote: voteEnum }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Vote recorded",
      content: {
        "application/json": {
          schema: z.object({ voteCount: z.number().optional(), status: z.string().optional() }),
        },
      },
    },
  },
  tags: ["Curation"],
});

curation.openapi(voteRoute, async (c) => {
  const { id } = c.req.valid("param");
  const { vote } = c.req.valid("json");
  const userId = c.get("userId") ?? "anonymous";
  const svc = new CurationService(c.get("db"));

  const result = await svc.vote(id, userId, vote);
  return c.json(result);
});

// Cancel edit
const cancelRoute = createRoute({
  method: "post",
  path: "/edits/:id/cancel",
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      description: "Edit canceled",
      content: { "application/json": { schema: z.object({ status: z.string() }) } },
    },
  },
  tags: ["Curation"],
});

curation.openapi(cancelRoute, async (c) => {
  const { id } = c.req.valid("param");
  const userId = c.get("userId") ?? "anonymous";
  const svc = new CurationService(c.get("db"));

  const result = await svc.cancelEdit(id, userId);
  return c.json(result);
});

// Add comment to edit
const commentRoute = createRoute({
  method: "post",
  path: "/edits/:id/comments",
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        "application/json": {
          schema: z.object({ text: z.string().min(1).max(2000) }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Comment added",
      content: { "application/json": { schema: z.object({ id: z.string() }) } },
    },
  },
  tags: ["Curation"],
});

curation.openapi(commentRoute, async (c) => {
  const { id } = c.req.valid("param");
  const { text } = c.req.valid("json");
  const userId = c.get("userId") ?? "anonymous";
  const svc = new CurationService(c.get("db"));

  const comment = await svc.addComment(id, userId, text);
  return c.json({ id: comment.id });
});

// Get comments for edit
const listCommentsRoute = createRoute({
  method: "get",
  path: "/edits/:id/comments",
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      description: "Comments list",
      content: { "application/json": { schema: z.array(z.any()) } },
    },
  },
  tags: ["Curation"],
});

curation.openapi(listCommentsRoute, async (c) => {
  const { id } = c.req.valid("param");
  const svc = new CurationService(c.get("db"));
  return c.json(await svc.getComments(id));
});

// Get user reputation
const reputationRoute = createRoute({
  method: "get",
  path: "/users/:userId/reputation",
  request: {
    params: z.object({ userId: z.string() }),
  },
  responses: {
    200: {
      description: "User reputation",
      content: {
        "application/json": {
          schema: z.object({
            reputation: z.number(),
            rank: z.string(),
            editsSubmitted: z.number(),
            editsApproved: z.number(),
          }),
        },
      },
    },
  },
  tags: ["Curation"],
});

curation.openapi(reputationRoute, async (c) => {
  const { userId } = c.req.valid("param");
  const svc = new CurationService(c.get("db"));
  return c.json(await svc.getReputation(userId));
});

export { curation };
