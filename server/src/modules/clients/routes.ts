import { Router } from "express";
import { db, persist } from "../../db/store";
import {
  clientBankProfileSchema,
  createClientSchema,
  createHouseholdSchema,
  kycSnapshotSchema,
  riskProfileSnapshotSchema,
} from "../../domain/schema";
import type { ClientFinancialProfile, NetWorthRecord, PlanInputs } from "../../domain/types";
import { parseBody } from "../../lib/http";
import { requireAuth, requirePermission, type AuthedRequest } from "../../middleware/auth";
import { maskAddress, maskEmail, maskName, maskPhone } from "../../security/crypto";
import { readPiiRecord, upsertPiiRecord } from "../../security/piiVault";
import { appendAuditEvent } from "../audit/service";
import { CANADIAN_BANK_CATALOG } from "./bankCatalog";

function computeNetWorth(inputs: PlanInputs): NetWorthRecord["breakdown"] {
  const registeredAssets = inputs.registered.reduce((s, r) => s + r.currentBalance, 0);
  const nonRegisteredAssets = inputs.nonRegistered.reduce((s, r) => s + r.currentBalance, 0);
  const realEstateAssets = inputs.assets
    .filter((a) => a.category === "real_estate")
    .reduce((s, a) => s + a.currentValue, 0);
  const otherAssets = inputs.assets
    .filter((a) => a.category !== "real_estate")
    .reduce((s, a) => s + a.currentValue, 0);
  const securedLiabilities = inputs.liabilities
    .filter((l) => l.amortizationYears && l.amortizationYears > 0)
    .reduce((s, l) => s + l.balance, 0);
  const unsecuredLiabilities = inputs.liabilities
    .filter((l) => !l.amortizationYears || l.amortizationYears <= 0)
    .reduce((s, l) => s + l.balance, 0);
  return {
    registeredAssets,
    nonRegisteredAssets,
    realEstateAssets,
    otherAssets,
    securedLiabilities,
    unsecuredLiabilities,
  };
}

export function clientsRouter(): Router {
  const router = Router();
  router.use(requireAuth);

  /* ─── Households ─── */

  router.get("/households", async (req: AuthedRequest, res) => {
    await db.read();
    const households = db.data.households.filter(
      (h) => h.organizationId === req.auth?.organizationId,
    );
    res.json(households);
  });

  router.post("/households", requirePermission("client.write"), async (req: AuthedRequest, res) => {
    await db.read();
    const payload = parseBody(createHouseholdSchema, req, res);
    if (!payload || !req.auth) return;

    const household = {
      id: crypto.randomUUID(),
      organizationId: req.auth.organizationId,
      householdName: payload.householdName,
      primaryAdvisorUserId: payload.primaryAdvisorUserId,
      createdAt: new Date().toISOString(),
    };
    db.data.households.push(household);
    appendAuditEvent(db.data, req.auth, {
      eventType: "household.created",
      entityType: "household",
      entityId: household.id,
      after: household,
    });
    await persist();
    res.status(201).json(household);
  });

  /* ─── Clients ─── */

  router.get("/", requirePermission("client.read"), async (req: AuthedRequest, res) => {
    await db.read();
    const clients = db.data.clients.filter((c) => c.organizationId === req.auth?.organizationId);
    res.json(clients);
  });

  router.get("/banks/catalog", async (_req: AuthedRequest, res) => {
    res.json({
      generatedAt: new Date().toISOString(),
      source:
        "Curated from public bank product pages; verify against institution websites for conformance-sensitive use.",
      banks: CANADIAN_BANK_CATALOG,
    });
  });

  router.post("/", requirePermission("client.write"), async (req: AuthedRequest, res) => {
    await db.read();
    const payload = parseBody(createClientSchema, req, res);
    if (!payload || !req.auth) return;
    const auth = req.auth;

    const household = db.data.households.find(
      (h) => h.id === payload.householdId && h.organizationId === auth.organizationId,
    );
    if (!household) {
      res.status(404).json({ error: "Household not found in your organization." });
      return;
    }

    const client = {
      id: crypto.randomUUID(),
      organizationId: auth.organizationId,
      householdId: payload.householdId,
      fullNameMasked: maskName(payload.fullName) ?? "N***",
      emailMasked: maskEmail(payload.email),
      phoneMasked: maskPhone(payload.phone),
      addressMasked: maskAddress(payload.address),
      dateOfBirth: payload.dateOfBirth,
      riskProfile: payload.riskProfile,
      kycCompleted: payload.kycCompleted ?? false,
      createdAt: new Date().toISOString(),
    };
    db.data.clients.push(client);
    await upsertPiiRecord(auth.organizationId, "client", client.id, {
      fullName: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      address: payload.address,
      dateOfBirth: payload.dateOfBirth,
    });
    appendAuditEvent(db.data, auth, {
      eventType: "client.created",
      entityType: "client",
      entityId: client.id,
      after: client,
    });
    await persist();
    res.status(201).json(client);
  });

  /* ─── Financial Profile ─── */

  router.get("/:clientId/profile", requirePermission("client.read"), async (req: AuthedRequest, res) => {
    await db.read();
    if (!req.auth) return;
    const profile = db.data.financialProfiles
      .filter(
        (f) =>
          f.organizationId === req.auth?.organizationId &&
          f.clientId === req.params.clientId,
      )
      .sort((a, b) => (a.effectiveDate < b.effectiveDate ? 1 : -1))[0];
    res.json(profile ?? null);
  });

  router.post("/:clientId/profile", requirePermission("client.write"), async (req: AuthedRequest, res) => {
    await db.read();
    if (!req.auth) return;
    const auth = req.auth;
    const inputs = req.body as PlanInputs;

    const client = db.data.clients.find(
      (c) => c.id === req.params.clientId && c.organizationId === auth.organizationId,
    );
    if (!client) {
      res.status(404).json({ error: "Client not found in your organization." });
      return;
    }

    const profile: ClientFinancialProfile = {
      id: crypto.randomUUID(),
      organizationId: auth.organizationId,
      clientId: req.params.clientId,
      effectiveDate: new Date().toISOString(),
      inputs,
      createdByUserId: auth.userId,
      createdAt: new Date().toISOString(),
    };
    db.data.financialProfiles.push(profile);
    appendAuditEvent(db.data, auth, {
      eventType: "financial_profile.saved",
      entityType: "client_financial_profile",
      entityId: profile.id,
      after: profile,
    });
    await persist();
    res.status(201).json(profile);
  });

  /* ─── PII (restricted) ─── */

  router.get("/:clientId/pii", requirePermission("client.read"), async (req: AuthedRequest, res) => {
    await db.read();
    if (!req.auth) return;
    if (!["owner", "advisor", "compliance"].includes(req.auth.role)) {
      res.status(403).json({ error: "Insufficient role for PII access." });
      return;
    }
    const client = db.data.clients.find(
      (c) => c.id === req.params.clientId && c.organizationId === req.auth?.organizationId,
    );
    if (!client) {
      res.status(404).json({ error: "Client not found in your organization." });
      return;
    }
    const pii = await readPiiRecord(req.auth.organizationId, "client", client.id);
    res.json({ clientId: client.id, pii });
  });

  /* ─── Risk Profile Snapshots (PRD §4.2) ─── */

  router.get("/:clientId/risk-profiles", requirePermission("client.read"), async (req: AuthedRequest, res) => {
    await db.read();
    const snapshots = db.data.riskProfileSnapshots
      .filter((r) => r.clientId === req.params.clientId && r.organizationId === req.auth?.organizationId)
      .sort((a, b) => (a.assessedAt < b.assessedAt ? 1 : -1));
    res.json(snapshots);
  });

  router.post("/:clientId/risk-profiles", requirePermission("client.write"), async (req: AuthedRequest, res) => {
    await db.read();
    if (!req.auth) return;
    const payload = parseBody(riskProfileSnapshotSchema, req, res);
    if (!payload) return;
    if (payload.clientId !== req.params.clientId) {
      res.status(400).json({ error: "clientId mismatch." });
      return;
    }
    const client = db.data.clients.find(
      (c) => c.id === payload.clientId && c.organizationId === req.auth?.organizationId,
    );
    if (!client) {
      res.status(404).json({ error: "Client not found." });
      return;
    }
    const snapshot = {
      id: crypto.randomUUID(),
      organizationId: req.auth.organizationId,
      clientId: payload.clientId,
      riskTolerance: payload.riskTolerance,
      investmentHorizon: payload.investmentHorizon,
      incomeStability: payload.incomeStability,
      knowledgeLevel: payload.knowledgeLevel,
      notes: payload.notes,
      assessedByUserId: req.auth.userId,
      assessedAt: new Date().toISOString(),
    };
    db.data.riskProfileSnapshots.push(snapshot);
    client.riskProfile = payload.riskTolerance;
    appendAuditEvent(db.data, req.auth, {
      eventType: "risk_profile.created",
      entityType: "risk_profile_snapshot",
      entityId: snapshot.id,
      after: snapshot,
    });
    await persist();
    res.status(201).json(snapshot);
  });

  /* ─── KYC Versioning (PRD §4.2) ─── */

  router.get("/:clientId/kyc", requirePermission("client.read"), async (req: AuthedRequest, res) => {
    await db.read();
    const snapshots = db.data.kycSnapshots
      .filter((k) => k.clientId === req.params.clientId && k.organizationId === req.auth?.organizationId)
      .sort((a, b) => (a.completedAt < b.completedAt ? 1 : -1));
    res.json(snapshots);
  });

  router.post("/:clientId/kyc", requirePermission("client.write"), async (req: AuthedRequest, res) => {
    await db.read();
    if (!req.auth) return;
    const payload = parseBody(kycSnapshotSchema, req, res);
    if (!payload) return;
    if (payload.clientId !== req.params.clientId) {
      res.status(400).json({ error: "clientId mismatch." });
      return;
    }
    const client = db.data.clients.find(
      (c) => c.id === payload.clientId && c.organizationId === req.auth?.organizationId,
    );
    if (!client) {
      res.status(404).json({ error: "Client not found." });
      return;
    }
    const existingCount = db.data.kycSnapshots.filter(
      (k) => k.clientId === payload.clientId && k.organizationId === req.auth?.organizationId,
    ).length;
    const snapshot = {
      id: crypto.randomUUID(),
      organizationId: req.auth.organizationId,
      clientId: payload.clientId,
      versionNumber: existingCount + 1,
      identityVerified: payload.identityVerified,
      employmentStatus: payload.employmentStatus,
      sourceOfFunds: payload.sourceOfFunds,
      politicallyExposed: payload.politicallyExposed,
      sanctionsChecked: payload.sanctionsChecked,
      notes: payload.notes,
      completedByUserId: req.auth.userId,
      completedAt: new Date().toISOString(),
    };
    db.data.kycSnapshots.push(snapshot);
    client.kycCompleted = true;
    appendAuditEvent(db.data, req.auth, {
      eventType: "kyc.snapshot_created",
      entityType: "kyc_snapshot",
      entityId: snapshot.id,
      after: snapshot,
    });
    await persist();
    res.status(201).json(snapshot);
  });

  /* ─── Net Worth Computation Engine (PRD §4.2) ─── */

  router.get("/:clientId/net-worth", requirePermission("client.read"), async (req: AuthedRequest, res) => {
    await db.read();
    const records = db.data.netWorthRecords
      .filter((n) => n.clientId === req.params.clientId && n.organizationId === req.auth?.organizationId)
      .sort((a, b) => (a.computedAt < b.computedAt ? 1 : -1));
    res.json(records);
  });

  router.post("/:clientId/net-worth", requirePermission("client.write"), async (req: AuthedRequest, res) => {
    await db.read();
    if (!req.auth) return;
    const auth = req.auth;
    const client = db.data.clients.find(
      (c) => c.id === req.params.clientId && c.organizationId === auth.organizationId,
    );
    if (!client) {
      res.status(404).json({ error: "Client not found." });
      return;
    }
    const latestProfile = db.data.financialProfiles
      .filter((f) => f.clientId === client.id && f.organizationId === auth.organizationId)
      .sort((a, b) => (a.effectiveDate < b.effectiveDate ? 1 : -1))[0];
    if (!latestProfile) {
      res.status(400).json({ error: "No financial profile available for net worth computation." });
      return;
    }
    const breakdown = computeNetWorth(latestProfile.inputs);
    const totalAssets = breakdown.registeredAssets + breakdown.nonRegisteredAssets + breakdown.realEstateAssets + breakdown.otherAssets;
    const totalLiabilities = breakdown.securedLiabilities + breakdown.unsecuredLiabilities;
    const record: NetWorthRecord = {
      id: crypto.randomUUID(),
      organizationId: auth.organizationId,
      clientId: client.id,
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
      breakdown,
      computedByUserId: auth.userId,
      computedAt: new Date().toISOString(),
    };
    db.data.netWorthRecords.push(record);
    appendAuditEvent(db.data, auth, {
      eventType: "net_worth.computed",
      entityType: "net_worth_record",
      entityId: record.id,
      after: record,
    });
    await persist();
    res.status(201).json(record);
  });

  /* ─── Bank Profiles ─── */

  router.get("/:clientId/bank-profile", async (req: AuthedRequest, res) => {
    await db.read();
    if (!req.auth) return;
    const client = db.data.clients.find(
      (c) => c.id === req.params.clientId && c.organizationId === req.auth?.organizationId,
    );
    if (!client) {
      res.status(404).json({ error: "Client not found in your organization." });
      return;
    }
    const profile =
      db.data.clientBankProfiles.find(
        (p) =>
          p.clientId === req.params.clientId &&
          p.organizationId === req.auth?.organizationId,
      ) ?? null;
    res.json(profile);
  });

  router.put(
    "/:clientId/bank-profile",
    requirePermission("client.write"),
    async (req: AuthedRequest, res) => {
      await db.read();
      if (!req.auth) return;
      const payload = parseBody(clientBankProfileSchema, req, res);
      if (!payload) return;
      const client = db.data.clients.find(
        (c) =>
          c.id === req.params.clientId &&
          c.organizationId === req.auth?.organizationId,
      );
      if (!client) {
        res.status(404).json({ error: "Client not found in your organization." });
        return;
      }
      const allowedCodes = new Set(CANADIAN_BANK_CATALOG.map((b) => b.bankCode));
      for (const linked of payload.linkedBanks) {
        if (!allowedCodes.has(linked.bankCode)) {
          res.status(400).json({ error: `Unknown bankCode: ${linked.bankCode}` });
          return;
        }
      }
      let profile = db.data.clientBankProfiles.find(
        (p) =>
          p.clientId === req.params.clientId &&
          p.organizationId === req.auth?.organizationId,
      );
      const before = profile ? { ...profile } : undefined;
      if (!profile) {
        profile = {
          id: crypto.randomUUID(),
          organizationId: req.auth.organizationId,
          clientId: req.params.clientId,
          primaryBankCode: payload.primaryBankCode,
          linkedBanks: payload.linkedBanks,
          updatedByUserId: req.auth.userId,
          updatedAt: new Date().toISOString(),
        };
        db.data.clientBankProfiles.push(profile);
      } else {
        profile.primaryBankCode = payload.primaryBankCode;
        profile.linkedBanks = payload.linkedBanks;
        profile.updatedByUserId = req.auth.userId;
        profile.updatedAt = new Date().toISOString();
      }
      appendAuditEvent(db.data, req.auth, {
        eventType: "client.bank_profile.updated",
        entityType: "client_bank_profile",
        entityId: profile.id,
        before,
        after: profile,
      });
      await persist();
      res.json(profile);
    },
  );

  return router;
}
