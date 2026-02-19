import cors from "cors";
import express from "express";
import { initDb } from "./db/store";
import { rateLimiter } from "./middleware/rateLimiter";
import { apiLogger } from "./middleware/apiLogger";
import { authRouter } from "./modules/auth/routes";
import { clientsRouter } from "./modules/clients/routes";
import { plansRouter } from "./modules/plans/routes";
import { complianceRouter } from "./modules/compliance/routes";
import { aiRouter } from "./modules/ai/routes";
import { reportsRouter } from "./modules/reports/routes";
import { portalRouter } from "./modules/portal/routes";
import { fdxRouter } from "./modules/fdx/routes";
import { openApiRouter } from "./modules/openapi/routes";
import { analyticsRouter } from "./modules/analytics/routes";
import { notificationsRouter } from "./modules/notifications/routes";
import { telemetryRouter } from "./modules/telemetry/routes";
import { controlsRouter } from "./modules/controls/routes";
import { insightsRouter } from "./modules/insights/routes";
import { ethicsRouter } from "./modules/ethics/routes";
import { retentionRouter } from "./modules/retention/routes";

const app = express();
const PORT = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(rateLimiter);
app.use(apiLogger);

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "acip-api", version: "1.0.0" });
});

app.use("/api/auth", authRouter());
app.use("/api/clients", clientsRouter());
app.use("/api/plans", plansRouter());
app.use("/api/compliance", complianceRouter());
app.use("/api/ai", aiRouter());
app.use("/api/reports", reportsRouter());
app.use("/api/portal", portalRouter());
app.use("/api/fdx/v5", fdxRouter());
app.use("/api", openApiRouter());
app.use("/api/analytics", analyticsRouter());
app.use("/api/notifications", notificationsRouter());
app.use("/api/telemetry", telemetryRouter());
app.use("/api/controls", controlsRouter());
app.use("/api/insights", insightsRouter());
app.use("/api/ethics", ethicsRouter());
app.use("/api/retention", retentionRouter());

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found." });
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`ACIP API running on http://localhost:${PORT}`);
    });
  })
  .catch((err: unknown) => {
    console.error("Failed to initialize DB", err);
    process.exit(1);
  });
