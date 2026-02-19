import type { PlanInputs, ProjectionYear } from "../types";

export type UserRole = "owner" | "advisor" | "associate" | "compliance" | "client" | "system_admin";

export type PlanLifecycleStatus =
  | "draft"
  | "reviewed"
  | "presented"
  | "accepted"
  | "archived";

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
}

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

export interface PortalSession {
  token: string;
  organizationId: string;
  clientId: string;
  expiresAt: string;
  createdByUserId: string;
}

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

export interface DataRetentionPolicy {
  id: string;
  organizationId: string;
  dataType: "client_pii" | "audit_logs" | "consent_logs" | "ai_drafts";
  retentionYears: number;
  permanent: boolean;
  lastEnforcedAt?: string;
}
