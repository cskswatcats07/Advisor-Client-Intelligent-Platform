import type {
  AdvisorUser,
  AiDraft,
  AuditEvent,
  BankCatalogEntry,
  Client,
  ClientBankProfile,
  ConflictDisclosure,
  DataRetentionPolicy,
  DisclosureAcceptance,
  InsightAlert,
  KycSnapshot,
  NetWorthRecord,
  Plan,
  PlanApproval,
  PlanVersion,
  RecommendationNote,
  RiskProfileSnapshot,
  Scenario,
} from "../../shared/advisor-types";
import type { PlanInputs } from "../../types";

export interface ApiSession {
  organizationId: string;
  userId: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

async function request<T>(
  path: string,
  session?: ApiSession,
  init?: RequestInit,
): Promise<T> {
  const started = Date.now();
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (session) {
    headers.set("x-org-id", session.organizationId);
    headers.set("x-user-id", session.userId);
  }
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...init,
    headers,
  });
  if (session && path !== "/api/telemetry/browser-call") {
    void fetch(`${API_BASE}/api/telemetry/browser-call`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-org-id": session.organizationId,
        "x-user-id": session.userId,
      },
      body: JSON.stringify({
        protocol: url.startsWith("https") ? "https" : "http",
        method: init?.method ?? "GET",
        route: path,
        statusCode: res.status,
        durationMs: Date.now() - started,
        details: { ok: res.ok },
      }),
    }).catch(() => undefined);
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed with status ${res.status}`);
  }
  return (await res.json()) as T;
}

export interface BootstrapPayload {
  organizations: { id: string; name: string }[];
  users: AdvisorUser[];
}

export interface LoginPayload {
  user: AdvisorUser;
  authHeaders: {
    "x-org-id": string;
    "x-user-id": string;
  };
}

export const api = {
  health: () => request<{ ok: boolean }>("/health"),
  bootstrap: () => request<BootstrapPayload>("/api/auth/bootstrap"),
  login: (organizationId: string, email: string) =>
    request<LoginPayload>("/api/auth/login", undefined, {
      method: "POST",
      body: JSON.stringify({ organizationId, email }),
    }),
  me: (session: ApiSession) =>
    request<{ auth: Record<string, string>; user: AdvisorUser }>("/api/auth/me", session),

  /* ─── Clients ─── */
  listHouseholds: (session: ApiSession) =>
    request<Array<{ id: string; householdName: string }>>("/api/clients/households", session),
  createHousehold: (
    session: ApiSession,
    payload: { householdName: string; primaryAdvisorUserId: string },
  ) =>
    request("/api/clients/households", session, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  listClients: (session: ApiSession) => request<Client[]>("/api/clients", session),
  createClient: (
    session: ApiSession,
    payload: {
      householdId: string;
      fullName: string;
      email?: string;
      phone?: string;
      address?: string;
      primaryBankCode?: string;
      riskProfile?: "low" | "moderate" | "high";
      kycCompleted: boolean;
    },
  ) =>
    request<Client>("/api/clients", session, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getClientProfile: (session: ApiSession, clientId: string) =>
    request<{ inputs: PlanInputs } | null>(`/api/clients/${clientId}/profile`, session),
  saveClientProfile: (session: ApiSession, clientId: string, inputs: PlanInputs) =>
    request(`/api/clients/${clientId}/profile`, session, {
      method: "POST",
      body: JSON.stringify(inputs),
    }),

  /* ─── Risk Profile (PRD §4.2) ─── */
  listRiskProfiles: (session: ApiSession, clientId: string) =>
    request<RiskProfileSnapshot[]>(`/api/clients/${clientId}/risk-profiles`, session),
  createRiskProfile: (
    session: ApiSession,
    clientId: string,
    payload: Omit<RiskProfileSnapshot, "id" | "organizationId" | "assessedByUserId" | "assessedAt">,
  ) =>
    request<RiskProfileSnapshot>(`/api/clients/${clientId}/risk-profiles`, session, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /* ─── KYC (PRD §4.2) ─── */
  listKycSnapshots: (session: ApiSession, clientId: string) =>
    request<KycSnapshot[]>(`/api/clients/${clientId}/kyc`, session),
  createKycSnapshot: (
    session: ApiSession,
    clientId: string,
    payload: Omit<KycSnapshot, "id" | "organizationId" | "versionNumber" | "completedByUserId" | "completedAt">,
  ) =>
    request<KycSnapshot>(`/api/clients/${clientId}/kyc`, session, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /* ─── Net Worth (PRD §4.2) ─── */
  listNetWorthRecords: (session: ApiSession, clientId: string) =>
    request<NetWorthRecord[]>(`/api/clients/${clientId}/net-worth`, session),
  computeNetWorth: (session: ApiSession, clientId: string) =>
    request<NetWorthRecord>(`/api/clients/${clientId}/net-worth`, session, {
      method: "POST",
    }),

  /* ─── Plans ─── */
  listPlans: (session: ApiSession) => request<Plan[]>("/api/plans", session),
  createPlan: (
    session: ApiSession,
    payload: {
      title: string;
      householdId: string;
      assumptionsSummary: string;
      inputs: PlanInputs;
    },
  ) =>
    request<{ plan: Plan; version: PlanVersion }>("/api/plans", session, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  createPlanVersion: (
    session: ApiSession,
    planId: string,
    payload: {
      title: string;
      householdId: string;
      assumptionsSummary: string;
      inputs: PlanInputs;
    },
  ) =>
    request<PlanVersion>(`/api/plans/${planId}/versions`, session, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  listPlanVersions: (session: ApiSession, planId: string) =>
    request<PlanVersion[]>(`/api/plans/${planId}/versions`, session),
  listScenarios: (session: ApiSession, planId: string) =>
    request<Scenario[]>(`/api/plans/${planId}/scenarios`, session),
  createScenario: (
    session: ApiSession,
    payload: {
      planVersionId: string;
      name: string;
      notes?: string;
      inputs: PlanInputs;
    },
  ) =>
    request<Scenario>("/api/plans/scenarios", session, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  changePlanStatus: (session: ApiSession, planId: string, status: Plan["status"]) =>
    request<Plan>(`/api/plans/${planId}/status`, session, {
      method: "POST",
      body: JSON.stringify({ status }),
    }),

  /* ─── Compliance ─── */
  listRecommendations: (session: ApiSession) =>
    request<RecommendationNote[]>("/api/compliance/recommendations", session),
  createRecommendation: (
    session: ApiSession,
    payload: {
      planId: string;
      clientId: string;
      recommendationText: string;
      rationale: string;
      advisorAttested: boolean;
    },
  ) =>
    request<RecommendationNote>("/api/compliance/recommendations", session, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  listDisclosures: (session: ApiSession) =>
    request<DisclosureAcceptance[]>("/api/compliance/disclosures", session),
  acceptDisclosure: (
    session: ApiSession,
    payload: {
      clientId: string;
      planVersionId: string;
      disclosureType: "limitations" | "assumptions" | "not_advice" | "conflict_of_interest";
      acceptedByName: string;
    },
  ) =>
    request<DisclosureAcceptance>("/api/compliance/disclosures/accept", session, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  listAudit: (session: ApiSession) => request<AuditEvent[]>("/api/compliance/audit", session),
  listApprovals: (session: ApiSession) =>
    request<PlanApproval[]>("/api/compliance/approvals", session),
  submitApproval: (
    session: ApiSession,
    payload: { planId: string; notes?: string },
  ) =>
    request<PlanApproval>("/api/compliance/approvals/submit", session, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  decideApproval: (
    session: ApiSession,
    payload: { approvalId: string; status: "approved" | "rejected"; notes?: string },
  ) =>
    request<PlanApproval>("/api/compliance/approvals/decision", session, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /* ─── AI Copilot ─── */
  listAiDrafts: (session: ApiSession) => request<AiDraft[]>("/api/ai/drafts", session),
  createAiDraft: (
    session: ApiSession,
    payload: {
      clientId?: string;
      planId?: string;
      prompt: string;
      draftType: "meeting_summary" | "scenario_explanation" | "compliance_check";
    },
  ) =>
    request<AiDraft>("/api/ai/drafts", session, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  editAiDraft: (session: ApiSession, draftId: string, editedOutput: string) =>
    request<AiDraft>("/api/ai/edit", session, {
      method: "POST",
      body: JSON.stringify({ draftId, editedOutput }),
    }),
  attestAiDraft: (session: ApiSession, draftId: string, attestedByUserId: string) =>
    request<AiDraft>("/api/ai/attest", session, {
      method: "POST",
      body: JSON.stringify({ draftId, attestedByUserId }),
    }),

  /* ─── Insights Engine (PRD §4.8) ─── */
  getClientInsights: (session: ApiSession, clientId: string) =>
    request<{
      clientId: string;
      computed: InsightAlert[];
      persisted: InsightAlert[];
      disclaimer: string;
    }>(`/api/insights/${clientId}`, session),
  generateInsights: (session: ApiSession, clientId: string) =>
    request<{ generated: number; alerts: InsightAlert[] }>(
      `/api/insights/${clientId}/generate`,
      session,
      { method: "POST" },
    ),
  approveInsightForClient: (session: ApiSession, alertId: string) =>
    request<InsightAlert>(`/api/insights/${alertId}/approve-for-client`, session, {
      method: "POST",
    }),
  resolveInsight: (session: ApiSession, alertId: string) =>
    request<InsightAlert>(`/api/insights/${alertId}/resolve`, session, {
      method: "POST",
    }),

  /* ─── Ethics (PRD §10) ─── */
  listConflictDisclosures: (session: ApiSession) =>
    request<ConflictDisclosure[]>("/api/ethics/conflicts", session),
  createConflictDisclosure: (
    session: ApiSession,
    payload: {
      clientId?: string;
      conflictType: ConflictDisclosure["conflictType"];
      description: string;
      mitigationStrategy: string;
    },
  ) =>
    request<ConflictDisclosure>("/api/ethics/conflicts", session, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getTransparencyDashboard: (session: ApiSession, clientId: string) =>
    request(`/api/ethics/transparency/${clientId}`, session),

  /* ─── Portal & Reports ─── */
  createPortalSession: (
    session: ApiSession,
    payload: { clientId: string; expiresInHours: number },
  ) =>
    request<{ token: string; portalUrl: string; expiresAt: string }>(
      "/api/portal/sessions",
      session,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    ),
  reportSummary: (session: ApiSession, clientId: string) =>
    request(`/api/reports/client/${clientId}/summary`, session),

  /* ─── Bank Catalog ─── */
  bankCatalog: (session: ApiSession) =>
    request<{ generatedAt: string; source: string; banks: BankCatalogEntry[] }>(
      "/api/clients/banks/catalog",
      session,
    ),
  getClientBankProfile: (session: ApiSession, clientId: string) =>
    request<ClientBankProfile | null>(`/api/clients/${clientId}/bank-profile`, session),
  saveClientBankProfile: (
    session: ApiSession,
    clientId: string,
    payload: Pick<ClientBankProfile, "primaryBankCode" | "linkedBanks">,
  ) =>
    request<ClientBankProfile>(`/api/clients/${clientId}/bank-profile`, session, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  /* ─── Analytics ─── */
  analyticsDashboard: (session: ApiSession) => request("/api/analytics/dashboard", session),

  /* ─── Data Retention ─── */
  listRetentionPolicies: (session: ApiSession) =>
    request<DataRetentionPolicy[]>("/api/retention/policies", session),

  /* ─── Notifications & 2FA ─── */
  listNotificationTemplates: (session: ApiSession) =>
    request("/api/notifications/templates", session),
  listNotificationRules: (session: ApiSession) =>
    request("/api/notifications/rules", session),
  start2fa: (session: ApiSession, userId: string, purpose: string) =>
    request("/api/notifications/2fa/start", session, {
      method: "POST",
      body: JSON.stringify({ userId, purpose }),
    }),
  verify2fa: (session: ApiSession, challengeId: string, userId: string, otp: string) =>
    request("/api/notifications/2fa/verify", session, {
      method: "POST",
      body: JSON.stringify({ challengeId, userId, otp }),
    }),

  /* ─── Telemetry ─── */
  telemetryLogs: (session: ApiSession, direction?: "inbound" | "outbound" | "browser") =>
    request(
      `/api/telemetry/logs${direction ? `?direction=${direction}` : ""}`,
      session,
    ),
};
