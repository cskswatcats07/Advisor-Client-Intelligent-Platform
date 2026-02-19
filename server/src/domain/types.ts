export type Province =
  | "AB"
  | "BC"
  | "MB"
  | "NB"
  | "NL"
  | "NS"
  | "NT"
  | "NU"
  | "ON"
  | "PE"
  | "QC"
  | "SK"
  | "YT";

export interface Profile {
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  province: Province;
}

export interface Asset {
  id: string;
  name: string;
  category: "cash" | "investments" | "real_estate" | "vehicle" | "other";
  currentValue: number;
  annualGrowthRatePercent: number;
  annualDepreciationPercent?: number;
  usefulLifeYears?: number;
}

export interface Liability {
  id: string;
  name: string;
  balance: number;
  interestRatePercent: number;
  minimumMonthlyPayment: number;
  amortizationYears?: number;
}

export interface RegisteredAccount {
  type: "RRSP" | "TFSA" | "FHSA";
  currentBalance: number;
  annualContribution: number;
  growthRatePercent: number;
  earnedIncomeForLimit?: number;
}

export interface NonRegisteredAccount {
  id: string;
  name: string;
  currentBalance: number;
  taxableYieldPercent: number;
  growthRatePercent: number;
  costBasis?: number;
}

export interface IncomeExpense {
  annualEmploymentIncome: number;
  annualOtherIncome: number;
  annualEssentialExpenses: number;
  annualDiscretionaryExpenses: number;
  retirementExpenseRatio: number;
}

export interface Assumptions {
  inflationRatePercent: number;
  realReturnPercent: number;
  withdrawalOrder: "RRSP_first" | "TFSA_first" | "NonReg_first";
}

export interface ProjectionYear {
  age: number;
  year: number;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  rrspBalance: number;
  tfsaBalance: number;
  fhsaBalance: number;
  nonRegisteredBalance: number;
  estimatedTax: number;
  expenses: number;
  income: number;
  isRetired: boolean;
}

export interface PlanInputs {
  profile: Profile;
  assets: Asset[];
  liabilities: Liability[];
  registered: RegisteredAccount[];
  nonRegistered: NonRegisteredAccount[];
  incomeExpense: IncomeExpense;
  assumptions: Assumptions;
}

/* ─── RBAC (PRD §7) ─── */

export type UserRole = "owner" | "advisor" | "associate" | "compliance" | "client" | "system_admin";

export type Permission =
  | "client.read"
  | "client.write"
  | "consent.manage"
  | "plan.create"
  | "plan.read"
  | "compliance.approve"
  | "audit.read"
  | "audit.export"
  | "ai.generate"
  | "ai.attest"
  | "portal.manage"
  | "settings.manage"
  | "insights.read"
  | "reports.read";

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  owner: [
    "client.read", "client.write", "consent.manage", "plan.create", "plan.read",
    "compliance.approve", "audit.read", "audit.export", "ai.generate", "ai.attest",
    "portal.manage", "settings.manage", "insights.read", "reports.read",
  ],
  advisor: [
    "client.read", "client.write", "consent.manage", "plan.create", "plan.read",
    "ai.generate", "ai.attest", "portal.manage", "insights.read", "reports.read",
  ],
  associate: [
    "client.read", "client.write", "plan.create", "plan.read",
    "ai.generate", "insights.read", "reports.read",
  ],
  compliance: [
    "client.read", "plan.read", "compliance.approve", "audit.read", "audit.export",
    "insights.read", "reports.read",
  ],
  client: ["plan.read"],
  system_admin: [
    "client.read", "client.write", "consent.manage", "plan.create", "plan.read",
    "compliance.approve", "audit.read", "audit.export", "ai.generate", "ai.attest",
    "portal.manage", "settings.manage", "insights.read", "reports.read",
  ],
};

export type PlanLifecycleStatus =
  | "draft"
  | "reviewed"
  | "presented"
  | "accepted"
  | "archived";

/* ─── Multi-Tenant (PRD §4.1) ─── */

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
}

export interface AdvisorUser {
  id: string;
  organizationId: string;
  email: string;
  fullName: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
}

/* ─── Client CRM (PRD §4.2) ─── */

export interface Household {
  id: string;
  organizationId: string;
  householdName: string;
  primaryAdvisorUserId: string;
  createdAt: string;
}

export interface Client {
  id: string;
  organizationId: string;
  householdId: string;
  fullNameMasked: string;
  emailMasked?: string;
  phoneMasked?: string;
  addressMasked?: string;
  dateOfBirth?: string;
  riskProfile?: "low" | "moderate" | "high";
  kycCompleted: boolean;
  createdAt: string;
}

export interface ClientFinancialProfile {
  id: string;
  organizationId: string;
  clientId: string;
  effectiveDate: string;
  inputs: PlanInputs;
  createdByUserId: string;
  createdAt: string;
}

export interface RiskProfileSnapshot {
  id: string;
  organizationId: string;
  clientId: string;
  riskTolerance: "low" | "moderate" | "high";
  investmentHorizon: "short" | "medium" | "long";
  incomeStability: "stable" | "variable" | "uncertain";
  knowledgeLevel: "beginner" | "intermediate" | "advanced";
  notes?: string;
  assessedByUserId: string;
  assessedAt: string;
}

export interface KycSnapshot {
  id: string;
  organizationId: string;
  clientId: string;
  versionNumber: number;
  identityVerified: boolean;
  employmentStatus: string;
  sourceOfFunds: string;
  politicallyExposed: boolean;
  sanctionsChecked: boolean;
  notes?: string;
  completedByUserId: string;
  completedAt: string;
}

export interface NetWorthRecord {
  id: string;
  organizationId: string;
  clientId: string;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  breakdown: {
    registeredAssets: number;
    nonRegisteredAssets: number;
    realEstateAssets: number;
    otherAssets: number;
    securedLiabilities: number;
    unsecuredLiabilities: number;
  };
  computedByUserId: string;
  computedAt: string;
}

/* ─── Planning (PRD §4.5) ─── */

export interface Plan {
  id: string;
  organizationId: string;
  householdId: string;
  title: string;
  status: PlanLifecycleStatus;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlanVersion {
  id: string;
  organizationId: string;
  planId: string;
  versionNumber: number;
  profileSnapshot: PlanInputs;
  projections: ProjectionYear[];
  assumptionsSummary: string;
  createdByUserId: string;
  createdAt: string;
}

export interface Scenario {
  id: string;
  organizationId: string;
  planVersionId: string;
  name: string;
  notes?: string;
  inputs: PlanInputs;
  projections: ProjectionYear[];
  createdByUserId: string;
  createdAt: string;
}

/* ─── Compliance (PRD §4.6) ─── */

export interface RecommendationNote {
  id: string;
  organizationId: string;
  planId: string;
  clientId: string;
  recommendationText: string;
  rationale: string;
  advisorAttested: boolean;
  suitabilitySnapshot?: {
    riskProfile: string;
    investmentHorizon: string;
    netWorth: number;
    kycVersion: number;
  };
  createdByUserId: string;
  createdAt: string;
}

export interface DisclosureAcceptance {
  id: string;
  organizationId: string;
  clientId: string;
  planVersionId: string;
  disclosureType: "limitations" | "assumptions" | "not_advice" | "conflict_of_interest";
  acceptedAt: string;
  acceptedByName: string;
}

export interface MeetingNote {
  id: string;
  organizationId: string;
  clientId: string;
  meetingDate: string;
  notes: string;
  internalOnly: boolean;
  createdByUserId: string;
  createdAt: string;
}

export interface ReviewCycle {
  id: string;
  organizationId: string;
  clientId: string;
  cadence: "quarterly" | "semiannual" | "annual";
  nextReviewDate: string;
  ownerUserId: string;
}

export interface AuditEvent {
  id: string;
  organizationId: string;
  actorUserId: string;
  actorHash?: string;
  actorRole?: UserRole;
  eventType: string;
  entityType: string;
  entityId: string;
  interactionId?: string;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, string | number | boolean>;
  createdAt: string;
  retentionExpiresAt?: string;
}

export interface PlanApproval {
  id: string;
  organizationId: string;
  planId: string;
  submittedByUserId: string;
  submittedAt: string;
  approvedByUserId?: string;
  approvedAt?: string;
  status: "submitted" | "approved" | "rejected";
  notes?: string;
}

/* ─── AI Copilot (PRD §4.7) ─── */

export interface AiDraft {
  id: string;
  organizationId: string;
  clientId?: string;
  planId?: string;
  prompt: string;
  output: string;
  draftType: "meeting_summary" | "scenario_explanation" | "compliance_check";
  hallucinationDisclaimer: boolean;
  advisorEdited: boolean;
  publishedToClient: boolean;
  attestedByUserId?: string;
  attestedAt?: string;
  createdByUserId: string;
  createdAt: string;
  retentionExpiresAt?: string;
}

/* ─── Insights Engine (PRD §4.8 — replaces Personalized Offers) ─── */

export type InsightCategory =
  | "allocation_drift"
  | "risk_mismatch"
  | "liquidity_warning"
  | "conflict_of_interest";

export type InsightSeverity = "info" | "warning" | "critical";

export interface InsightAlert {
  id: string;
  organizationId: string;
  clientId: string;
  category: InsightCategory;
  severity: InsightSeverity;
  title: string;
  description: string;
  dataPoints?: Record<string, number | string>;
  advisorApprovedForClient: boolean;
  resolvedAt?: string;
  createdAt: string;
}

/* ─── Ethical Guardrails (PRD §10) ─── */

export interface ConflictDisclosure {
  id: string;
  organizationId: string;
  advisorUserId: string;
  clientId?: string;
  conflictType: "compensation" | "referral" | "proprietary_product" | "dual_role" | "other";
  description: string;
  mitigationStrategy: string;
  disclosedAt: string;
}

export interface AdvisorAttestation {
  id: string;
  organizationId: string;
  advisorUserId: string;
  entityType: "recommendation" | "ai_draft" | "plan" | "disclosure";
  entityId: string;
  attestationText: string;
  attestedAt: string;
}

/* ─── Portal (PRD §4.3 client consent portal) ─── */

export interface PortalSession {
  token: string;
  organizationId: string;
  clientId: string;
  expiresAt: string;
  createdByUserId: string;
}

/* ─── FDX / Consent Engine (PRD §4.3, §4.4) ─── */

export interface FdxConsent {
  id: string;
  organizationId: string;
  clientId?: string;
  advisorId?: string;
  customerId: string;
  institutionId?: string;
  grantedScopes: string[];
  status: "ACTIVE" | "REVOKED" | "EXPIRED";
  createdAt: string;
  expiresAt: string;
  revokedAt?: string;
}

export interface FdxAccessToken {
  token: string;
  organizationId: string;
  customerId: string;
  consentId: string;
  scope: string[];
  clientId: string;
  createdAt: string;
  expiresAt: string;
}

export interface FdxOAuthClient {
  clientId: string;
  clientSecret: string;
  organizationId: string;
  name: string;
  redirectUris: string[];
  active: boolean;
}

export interface FdxAuthorizationCode {
  code: string;
  organizationId: string;
  customerId: string;
  consentId: string;
  clientId: string;
  redirectUri: string;
  scope: string[];
  state?: string;
  createdAt: string;
  expiresAt: string;
  usedAt?: string;
}

/* ─── Security (PRD §5) ─── */

export interface EncryptedPiiRecord {
  id: string;
  organizationId: string;
  entityType: "client" | "user" | "profile" | "log";
  entityId: string;
  encryptedPayload: string;
  keyVersion: string;
  createdAt: string;
}

export interface ApiLogEntry {
  id: string;
  timestamp: string;
  direction: "inbound" | "outbound" | "browser";
  protocol: "http" | "https" | "ws" | "wss" | "peer";
  method: string;
  route: string;
  statusCode?: number;
  durationMs?: number;
  organizationId?: string;
  actorUserIdHash?: string;
  interactionId?: string;
  piiMaskApplied: boolean;
  maskedRequest?: Record<string, unknown>;
  maskedResponse?: Record<string, unknown>;
  encryptedSensitiveRefId?: string;
}

/* ─── Notifications (PRD §4.9) ─── */

export interface NotificationTemplate {
  id: string;
  organizationId: string;
  name: string;
  channel: "email" | "sms" | "push" | "webhook";
  subject?: string;
  body: string;
  active: boolean;
}

export interface NotificationRule {
  id: string;
  organizationId: string;
  name: string;
  triggerType: "alert" | "reminder" | "2fa" | "consent_expiry" | "suspicious_login" | "token_failure";
  templateId: string;
  conditionExpr: string;
  enabled: boolean;
  throttleMinutes?: number;
}

export interface NotificationEvent {
  id: string;
  organizationId: string;
  ruleId: string;
  recipientRef: string;
  payload: Record<string, string | number | boolean>;
  status: "queued" | "sent" | "failed";
  createdAt: string;
  sentAt?: string;
}

export interface TwoFactorChallenge {
  id: string;
  organizationId: string;
  userId: string;
  purpose: string;
  otpHash: string;
  expiresAt: string;
  attempts: number;
  verifiedAt?: string;
}

/* ─── Controls (PRD §4.6 — 2-eye/4-eye) ─── */

export interface ControlTicket {
  id: string;
  organizationId: string;
  action: string;
  targetEntityType: string;
  targetEntityId: string;
  requestedByUserId: string;
  requiredApprovals: 2 | 4;
  approverUserIds: string[];
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  resolvedAt?: string;
  notes?: string;
}

/* ─── Analytics / Insights config ─── */

export interface AnalyticsConfig {
  id: string;
  organizationId: string;
  metricDefinitions: Array<{
    key: string;
    label: string;
    formula: string;
    chartType: "kpi" | "line" | "bar" | "pie";
  }>;
  insightRules: Array<{
    id: string;
    name: string;
    category: InsightCategory;
    expr: string;
    severity: InsightSeverity;
    priority: number;
  }>;
}

export interface SecurityPolicyConfig {
  id: string;
  organizationId: string;
  keyVersion: string;
  strictTwoEyeActions: string[];
  strictFourEyeActions: string[];
  piiFields: string[];
  logRetentionDays: number;
}

/* ─── Data Retention Policy (PRD §6) ─── */

export interface DataRetentionPolicy {
  id: string;
  organizationId: string;
  dataType: "client_pii" | "audit_logs" | "consent_logs" | "ai_drafts";
  retentionYears: number;
  permanent: boolean;
  lastEnforcedAt?: string;
}

/* ─── Banking ─── */

export type BankInstitutionType = "brick_mortar" | "digital" | "neobank" | "credit_union";
export type BankProductCategory =
  | "accounts"
  | "credit_cards"
  | "mortgages"
  | "lending"
  | "insurance"
  | "wealth"
  | "business";

export interface BankProduct {
  productCode: string;
  name: string;
  category: BankProductCategory;
}

export interface BankCatalogEntry {
  bankCode: string;
  bankName: string;
  institutionType: BankInstitutionType;
  website: string;
  products: BankProduct[];
}

export interface ClientBankProfile {
  id: string;
  organizationId: string;
  clientId: string;
  primaryBankCode?: string;
  linkedBanks: Array<{
    bankCode: string;
    selectedProductCodes: string[];
    notes?: string;
  }>;
  updatedByUserId: string;
  updatedAt: string;
}

export interface AuthContext {
  organizationId: string;
  userId: string;
  role: UserRole;
}

/* ─── Database state ─── */

export interface DbState {
  organizations: Organization[];
  users: AdvisorUser[];
  households: Household[];
  clients: Client[];
  financialProfiles: ClientFinancialProfile[];
  riskProfileSnapshots: RiskProfileSnapshot[];
  kycSnapshots: KycSnapshot[];
  netWorthRecords: NetWorthRecord[];
  plans: Plan[];
  planVersions: PlanVersion[];
  scenarios: Scenario[];
  recommendationNotes: RecommendationNote[];
  disclosureAcceptances: DisclosureAcceptance[];
  meetingNotes: MeetingNote[];
  reviewCycles: ReviewCycle[];
  auditEvents: AuditEvent[];
  planApprovals: PlanApproval[];
  aiDrafts: AiDraft[];
  portalSessions: PortalSession[];
  fdxConsents: FdxConsent[];
  fdxAccessTokens: FdxAccessToken[];
  fdxOauthClients: FdxOAuthClient[];
  fdxAuthorizationCodes: FdxAuthorizationCode[];
  piiVault: EncryptedPiiRecord[];
  apiLogs: ApiLogEntry[];
  notificationTemplates: NotificationTemplate[];
  notificationRules: NotificationRule[];
  notificationEvents: NotificationEvent[];
  twoFactorChallenges: TwoFactorChallenge[];
  controlTickets: ControlTicket[];
  analyticsConfigs: AnalyticsConfig[];
  securityPolicies: SecurityPolicyConfig[];
  clientBankProfiles: ClientBankProfile[];
  insightAlerts: InsightAlert[];
  conflictDisclosures: ConflictDisclosure[];
  advisorAttestations: AdvisorAttestation[];
  dataRetentionPolicies: DataRetentionPolicy[];
}
