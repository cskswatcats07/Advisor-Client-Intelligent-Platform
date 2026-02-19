import { Router } from "express";
import { db } from "../../db/store";
import { requireAuth, type AuthedRequest } from "../../middleware/auth";

export function reportsRouter(): Router {
  const router = Router();
  router.use(requireAuth);

  router.get("/client/:clientId/summary", async (req: AuthedRequest, res) => {
    await db.read();
    const organizationId = req.auth?.organizationId;
    const client = db.data.clients.find(
      (c) => c.id === req.params.clientId && c.organizationId === organizationId,
    );
    if (!client) {
      res.status(404).json({ error: "Client not found." });
      return;
    }
    const household = db.data.households.find((h) => h.id === client.householdId);
    const plans = db.data.plans.filter(
      (p) => p.organizationId === organizationId && p.householdId === client.householdId,
    );
    const latestPlan = plans.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))[0];
    const latestVersion = latestPlan
      ? db.data.planVersions
          .filter((v) => v.planId === latestPlan.id)
          .sort((a, b) => b.versionNumber - a.versionNumber)[0]
      : undefined;

    res.json({
      generatedAt: new Date().toISOString(),
      disclaimer:
        "Illustrative planning output only. This summary is not financial, tax, or legal advice.",
      client,
      household,
      latestPlan,
      latestVersion,
      disclosures: db.data.disclosureAcceptances.filter(
        (d) => d.organizationId === organizationId && d.clientId === client.id,
      ),
      recommendationNotes: db.data.recommendationNotes.filter(
        (n) => n.organizationId === organizationId && n.clientId === client.id,
      ),
    });
  });

  return router;
}
