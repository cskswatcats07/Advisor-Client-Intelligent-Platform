import path from "node:path";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import type { DbState } from "../domain/types";
import { seedDbState } from "./seed";
import { maskEmail, maskName } from "../security/crypto";

const dbFilePath = path.resolve(process.cwd(), "data", "db.json");
const adapter = new JSONFile<DbState>(dbFilePath);
export const db = new Low<DbState>(adapter, seedDbState());

function ensureDbDefaults(state: DbState): DbState {
  const seeded = seedDbState();
  const merged: DbState = {
    organizations: state.organizations ?? seeded.organizations,
    users: state.users ?? seeded.users,
    households: state.households ?? seeded.households,
    clients: state.clients ?? seeded.clients,
    financialProfiles: state.financialProfiles ?? seeded.financialProfiles,
    riskProfileSnapshots: state.riskProfileSnapshots ?? seeded.riskProfileSnapshots,
    kycSnapshots: state.kycSnapshots ?? seeded.kycSnapshots,
    netWorthRecords: state.netWorthRecords ?? seeded.netWorthRecords,
    plans: state.plans ?? seeded.plans,
    planVersions: state.planVersions ?? seeded.planVersions,
    scenarios: state.scenarios ?? seeded.scenarios,
    recommendationNotes: state.recommendationNotes ?? seeded.recommendationNotes,
    disclosureAcceptances: state.disclosureAcceptances ?? seeded.disclosureAcceptances,
    meetingNotes: state.meetingNotes ?? seeded.meetingNotes,
    reviewCycles: state.reviewCycles ?? seeded.reviewCycles,
    auditEvents: state.auditEvents ?? seeded.auditEvents,
    planApprovals: state.planApprovals ?? seeded.planApprovals,
    aiDrafts: state.aiDrafts ?? seeded.aiDrafts,
    portalSessions: state.portalSessions ?? seeded.portalSessions,
    fdxConsents: state.fdxConsents ?? seeded.fdxConsents,
    fdxAccessTokens: state.fdxAccessTokens ?? seeded.fdxAccessTokens,
    fdxOauthClients: state.fdxOauthClients ?? seeded.fdxOauthClients,
    fdxAuthorizationCodes: state.fdxAuthorizationCodes ?? seeded.fdxAuthorizationCodes,
    piiVault: state.piiVault ?? seeded.piiVault,
    apiLogs: state.apiLogs ?? seeded.apiLogs,
    notificationTemplates: state.notificationTemplates ?? seeded.notificationTemplates,
    notificationRules: state.notificationRules ?? seeded.notificationRules,
    notificationEvents: state.notificationEvents ?? seeded.notificationEvents,
    twoFactorChallenges: state.twoFactorChallenges ?? seeded.twoFactorChallenges,
    controlTickets: state.controlTickets ?? seeded.controlTickets,
    analyticsConfigs: state.analyticsConfigs ?? seeded.analyticsConfigs,
    securityPolicies: state.securityPolicies ?? seeded.securityPolicies,
    clientBankProfiles: state.clientBankProfiles ?? seeded.clientBankProfiles,
    insightAlerts: state.insightAlerts ?? seeded.insightAlerts,
    conflictDisclosures: state.conflictDisclosures ?? seeded.conflictDisclosures,
    advisorAttestations: state.advisorAttestations ?? seeded.advisorAttestations,
    dataRetentionPolicies: state.dataRetentionPolicies ?? seeded.dataRetentionPolicies,
  };

  merged.clients = merged.clients.map((c) => {
    const legacy = c as unknown as { fullName?: string; email?: string };
    return {
      ...c,
      fullNameMasked: c.fullNameMasked ?? maskName(legacy.fullName) ?? "N***",
      emailMasked: c.emailMasked ?? maskEmail(legacy.email),
    };
  });

  // Migrate legacy AiDraft records missing new fields
  merged.aiDrafts = merged.aiDrafts.map((d) => ({
    ...d,
    hallucinationDisclaimer: d.hallucinationDisclaimer ?? true,
    advisorEdited: d.advisorEdited ?? false,
    publishedToClient: d.publishedToClient ?? false,
  }));

  // Migrate legacy AnalyticsConfig: rename personalizedOfferRules → insightRules
  merged.analyticsConfigs = merged.analyticsConfigs.map((c) => {
    const legacy = c as unknown as Record<string, unknown>;
    if (!c.insightRules && Array.isArray(legacy["personalizedOfferRules"])) {
      return { ...c, insightRules: [] };
    }
    return { ...c, insightRules: c.insightRules ?? [] };
  });

  return merged;
}

export async function initDb(): Promise<void> {
  await db.read();
  db.data ||= seedDbState();
  db.data = ensureDbDefaults(db.data);
  await db.write();
}

export async function persist(): Promise<void> {
  db.data = ensureDbDefaults(db.data);
  await db.write();
}
