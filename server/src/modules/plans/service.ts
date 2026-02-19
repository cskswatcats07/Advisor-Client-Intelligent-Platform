import type { AuthContext, DbState, Plan, PlanInputs, PlanVersion, Scenario } from "../../domain/types";
import { runProjection } from "./projection";

export interface PlanCreateInput {
  title: string;
  householdId: string;
  assumptionsSummary: string;
  inputs: PlanInputs;
}

export function createPlanWithInitialVersion(
  state: DbState,
  auth: AuthContext,
  input: PlanCreateInput,
): { plan: Plan; version: PlanVersion } {
  const now = new Date().toISOString();
  const plan: Plan = {
    id: crypto.randomUUID(),
    organizationId: auth.organizationId,
    householdId: input.householdId,
    title: input.title,
    status: "draft",
    createdByUserId: auth.userId,
    createdAt: now,
    updatedAt: now,
  };
  const version: PlanVersion = {
    id: crypto.randomUUID(),
    organizationId: auth.organizationId,
    planId: plan.id,
    versionNumber: 1,
    profileSnapshot: input.inputs,
    projections: runProjection(input.inputs),
    assumptionsSummary: input.assumptionsSummary,
    createdByUserId: auth.userId,
    createdAt: now,
  };
  state.plans.push(plan);
  state.planVersions.push(version);
  return { plan, version };
}

export function createPlanVersion(
  state: DbState,
  auth: AuthContext,
  plan: Plan,
  input: Pick<PlanCreateInput, "assumptionsSummary" | "inputs">,
): PlanVersion {
  const lastVersion = state.planVersions
    .filter((v) => v.planId === plan.id && v.organizationId === auth.organizationId)
    .sort((a, b) => b.versionNumber - a.versionNumber)[0];
  const version: PlanVersion = {
    id: crypto.randomUUID(),
    organizationId: auth.organizationId,
    planId: plan.id,
    versionNumber: (lastVersion?.versionNumber ?? 0) + 1,
    profileSnapshot: input.inputs,
    projections: runProjection(input.inputs),
    assumptionsSummary: input.assumptionsSummary,
    createdByUserId: auth.userId,
    createdAt: new Date().toISOString(),
  };
  state.planVersions.push(version);
  plan.updatedAt = new Date().toISOString();
  return version;
}

export interface ScenarioCreateInput {
  planVersionId: string;
  name: string;
  notes?: string;
  inputs: PlanInputs;
}

export function createScenario(
  state: DbState,
  auth: AuthContext,
  input: ScenarioCreateInput,
): Scenario {
  const scenario: Scenario = {
    id: crypto.randomUUID(),
    organizationId: auth.organizationId,
    planVersionId: input.planVersionId,
    name: input.name,
    notes: input.notes,
    inputs: input.inputs,
    projections: runProjection(input.inputs),
    createdByUserId: auth.userId,
    createdAt: new Date().toISOString(),
  };
  state.scenarios.push(scenario);
  return scenario;
}
