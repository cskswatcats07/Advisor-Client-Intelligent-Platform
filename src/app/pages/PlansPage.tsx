import { useEffect, useState } from "react";
import { useAuth } from "../auth";
import { api } from "../../shared/api/client";
import type { Plan, PlanVersion, Scenario } from "../../shared/advisor-types";

export function PlansPage() {
  const { session } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [versions, setVersions] = useState<PlanVersion[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);

  const loadPlans = async () => {
    if (!session) return;
    const next = await api.listPlans(session);
    setPlans(next);
    if (!selectedPlan && next[0]) setSelectedPlan(next[0].id);
  };

  useEffect(() => {
    void loadPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => {
    if (!session || !selectedPlan) return;
    Promise.all([
      api.listPlanVersions(session, selectedPlan),
      api.listScenarios(session, selectedPlan),
    ]).then(([nextVersions, nextScenarios]) => {
      setVersions(nextVersions);
      setScenarios(nextScenarios);
    });
  }, [selectedPlan, session]);

  const setStatus = async (planId: string, status: Plan["status"]) => {
    if (!session) return;
    await api.changePlanStatus(session, planId, status);
    await loadPlans();
  };

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Plans</h2>
        <p className="text-sm text-slate-600">
          View plan lifecycle states and scenario/version history by household.
        </p>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-slate-900">Plan list</h3>
          <ul className="mt-3 space-y-2">
            {plans.map((p) => (
              <li
                key={p.id}
                className={`rounded border px-3 py-2 text-sm ${
                  selectedPlan === p.id
                    ? "border-slate-900 bg-slate-100"
                    : "border-slate-200 bg-white"
                }`}
              >
                <button
                  className="w-full text-left"
                  onClick={() => setSelectedPlan(p.id)}
                >
                  <div className="font-medium">{p.title}</div>
                  <div className="text-xs text-slate-600">Status: {p.status}</div>
                </button>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(["draft", "reviewed", "presented", "accepted", "archived"] as Plan["status"][]).map(
                    (status) => (
                      <button
                        key={status}
                        className="rounded bg-slate-800 px-2 py-1 text-xs text-white"
                        onClick={() => setStatus(p.id, status)}
                      >
                        {status}
                      </button>
                    ),
                  )}
                </div>
              </li>
            ))}
            {plans.length === 0 && (
              <li className="text-sm text-slate-500">No plans found. Create one from a client workspace.</li>
            )}
          </ul>
        </div>
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="font-semibold text-slate-900">Versions</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {versions.map((v) => (
                <li key={v.id} className="rounded border border-slate-100 bg-slate-50 px-3 py-2">
                  v{v.versionNumber} - {v.assumptionsSummary}
                </li>
              ))}
              {versions.length === 0 && <li className="text-slate-500">No versions selected.</li>}
            </ul>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="font-semibold text-slate-900">Scenarios</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {scenarios.map((s) => (
                <li key={s.id} className="rounded border border-slate-100 bg-slate-50 px-3 py-2">
                  {s.name} {s.notes ? `- ${s.notes}` : ""}
                </li>
              ))}
              {scenarios.length === 0 && <li className="text-slate-500">No scenarios selected.</li>}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
