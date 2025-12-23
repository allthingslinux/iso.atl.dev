import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppEnv } from "../../types";
import { activity } from "./activity";
import { admin } from "./admin";
import { badgesRouter } from "./badges";
import { better } from "./better";
import { catalog } from "./catalog";
import { completeness } from "./completeness";
import { curation } from "./curation";
import { downloads } from "./downloads";
import { library } from "./library";
import { metrics } from "./metrics";
import { notifications } from "./notifications";
import { uploads } from "./uploads";

const v1 = new OpenAPIHono<AppEnv>();

v1.route("/activity", activity);
v1.route("/badges", badgesRouter);
v1.route("/better", better);
v1.route("/catalog", catalog);
v1.route("/completeness", completeness);
v1.route("/library", library);
v1.route("/curation", curation);
v1.route("/downloads", downloads);
v1.route("/metrics", metrics);
v1.route("/uploads", uploads);
v1.route("/notifications", notifications);
v1.route("/admin", admin);

export { v1 };
