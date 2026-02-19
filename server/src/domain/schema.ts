import { z } from "zod";

export const roleSchema = z.enum(["owner", "advisor", "associate", "compliance", "client", "system_admin"]);
export const planStatusSchema = z.enum(["draft", "reviewed", "presented", "accepted", "archived"]);

export const createClientSchema = z.object({
  householdId: z.string().min(1),
  fullName: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().min(6).optional(),
  address: z.string().min(4).optional(),
  dateOfBirth: z.string().optional(),
  riskProfile: z.enum(["low", "moderate", "high"]).optional(),
  kycCompleted: z.boolean().default(false),
});

export const createHouseholdSchema = z.object({
  householdName: z.string().min(2),
  primaryAdvisorUserId: z.string().min(1),
});

export const planInputEnvelopeSchema = z.object({
  title: z.string().min(3),
  householdId: z.string().min(1),
  assumptionsSummary: z.string().min(3),
  inputs: z.unknown(),
});

export const scenarioSchema = z.object({
  planVersionId: z.string().min(1),
  name: z.string().min(2),
  notes: z.string().optional(),
  inputs: z.unknown(),
});

export const recommendationSchema = z.object({
  planId: z.string().min(1),
  clientId: z.string().min(1),
  recommendationText: z.string().min(5),
  rationale: z.string().min(5),
  advisorAttested: z.boolean(),
});

export const disclosureAcceptanceSchema = z.object({
  clientId: z.string().min(1),
  planVersionId: z.string().min(1),
  disclosureType: z.enum(["limitations", "assumptions", "not_advice", "conflict_of_interest"]),
  acceptedByName: z.string().min(2),
});

export const aiDraftSchema = z.object({
  clientId: z.string().optional(),
  planId: z.string().optional(),
  prompt: z.string().min(4),
  draftType: z.enum(["meeting_summary", "scenario_explanation", "compliance_check"]),
});

export const aiAttestationSchema = z.object({
  draftId: z.string().min(1),
  attestedByUserId: z.string().min(1),
});

export const aiEditSchema = z.object({
  draftId: z.string().min(1),
  editedOutput: z.string().min(4),
});

export const portalSessionSchema = z.object({
  clientId: z.string().min(1),
  expiresInHours: z.number().int().positive().max(720).default(72),
});

export const fdxConsentCreateSchema = z.object({
  customerId: z.string().min(1),
  clientId: z.string().optional(),
  institutionId: z.string().optional(),
  scope: z.array(z.string().min(1)).min(1),
  durationDays: z.number().int().positive().max(365).default(90),
});

export const fdxTokenExchangeSchema = z.object({
  grant_type: z.literal("authorization_code"),
  code: z.string().min(1),
  redirect_uri: z.string().url(),
  client_id: z.string().min(1),
  client_secret: z.string().min(1),
});

export const fdxAuthorizeQuerySchema = z.object({
  response_type: z.literal("code"),
  client_id: z.string().min(1),
  redirect_uri: z.string().url(),
  scope: z.string().min(1),
  state: z.string().optional(),
  consent_id: z.string().min(1),
});

export const approvalSubmitSchema = z.object({
  planId: z.string().min(1),
  notes: z.string().optional(),
});

export const approvalDecisionSchema = z.object({
  approvalId: z.string().min(1),
  status: z.enum(["approved", "rejected"]),
  notes: z.string().optional(),
});

export const notificationTemplateSchema = z.object({
  name: z.string().min(2),
  channel: z.enum(["email", "sms", "push", "webhook"]),
  subject: z.string().optional(),
  body: z.string().min(4),
  active: z.boolean().default(true),
});

export const notificationRuleSchema = z.object({
  name: z.string().min(2),
  triggerType: z.enum(["alert", "reminder", "2fa", "consent_expiry", "suspicious_login", "token_failure"]),
  templateId: z.string().min(1),
  conditionExpr: z.string().min(2),
  enabled: z.boolean().default(true),
  throttleMinutes: z.number().int().positive().optional(),
});

export const twoFactorStartSchema = z.object({
  userId: z.string().min(1),
  purpose: z.string().min(2),
});

export const twoFactorVerifySchema = z.object({
  challengeId: z.string().min(1),
  userId: z.string().min(1),
  otp: z.string().min(4).max(12),
});

export const browserLogSchema = z.object({
  protocol: z.enum(["ws", "wss", "peer", "http", "https"]).default("peer"),
  method: z.string().default("BROWSER"),
  route: z.string().min(1),
  statusCode: z.number().int().optional(),
  durationMs: z.number().int().positive().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
});

export const controlTicketSchema = z.object({
  action: z.string().min(3),
  targetEntityType: z.string().min(2),
  targetEntityId: z.string().min(1),
  requiredApprovals: z.union([z.literal(2), z.literal(4)]),
  notes: z.string().optional(),
});

export const controlApproveSchema = z.object({
  ticketId: z.string().min(1),
  decision: z.enum(["approve", "reject"]),
  notes: z.string().optional(),
});

export const analyticsConfigSchema = z.object({
  metricDefinitions: z.array(
    z.object({
      key: z.string().min(2),
      label: z.string().min(2),
      formula: z.string().min(2),
      chartType: z.enum(["kpi", "line", "bar", "pie"]),
    }),
  ),
  insightRules: z.array(
    z.object({
      id: z.string().min(2),
      name: z.string().min(2),
      category: z.enum(["allocation_drift", "risk_mismatch", "liquidity_warning", "conflict_of_interest"]),
      expr: z.string().min(2),
      severity: z.enum(["info", "warning", "critical"]),
      priority: z.number().int(),
    }),
  ),
});

export const clientBankProfileSchema = z.object({
  primaryBankCode: z.string().optional(),
  linkedBanks: z.array(
    z.object({
      bankCode: z.string().min(1),
      selectedProductCodes: z.array(z.string().min(1)),
      notes: z.string().optional(),
    }),
  ),
});

export const riskProfileSnapshotSchema = z.object({
  clientId: z.string().min(1),
  riskTolerance: z.enum(["low", "moderate", "high"]),
  investmentHorizon: z.enum(["short", "medium", "long"]),
  incomeStability: z.enum(["stable", "variable", "uncertain"]),
  knowledgeLevel: z.enum(["beginner", "intermediate", "advanced"]),
  notes: z.string().optional(),
});

export const kycSnapshotSchema = z.object({
  clientId: z.string().min(1),
  identityVerified: z.boolean(),
  employmentStatus: z.string().min(2),
  sourceOfFunds: z.string().min(2),
  politicallyExposed: z.boolean(),
  sanctionsChecked: z.boolean(),
  notes: z.string().optional(),
});

export const conflictDisclosureSchema = z.object({
  clientId: z.string().optional(),
  conflictType: z.enum(["compensation", "referral", "proprietary_product", "dual_role", "other"]),
  description: z.string().min(10),
  mitigationStrategy: z.string().min(10),
});

export const advisorAttestationSchema = z.object({
  entityType: z.enum(["recommendation", "ai_draft", "plan", "disclosure"]),
  entityId: z.string().min(1),
  attestationText: z.string().min(5),
});
