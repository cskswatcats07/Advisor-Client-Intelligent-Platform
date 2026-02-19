import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ProfileForm } from "../../components/ProfileForm";
import { IncomeExpenseForm } from "../../components/IncomeExpenseForm";
import { RegisteredAccountsForm } from "../../components/RegisteredAccountsForm";
import { NonRegisteredForm } from "../../components/NonRegisteredForm";
import { AssetsForm } from "../../components/AssetsForm";
import { LiabilitiesForm } from "../../components/LiabilitiesForm";
import { AssumptionsForm } from "../../components/AssumptionsForm";
import { ResultsView } from "../../components/ResultsView";
import { defaultPlanInputs } from "../../data/defaults";
import { runProjection } from "../../engine/projection";
import type { PlanInputs } from "../../types";
import { useAuth } from "../auth";
import { api } from "../../shared/api/client";
import type {
  BankCatalogEntry,
  ClientBankProfile,
  InsightAlert,
  NetWorthRecord,
  PlanVersion,
} from "../../shared/advisor-types";

export function ClientWorkspacePage() {
  const { clientId = "" } = useParams();
  const { session } = useAuth();
  const [inputs, setInputs] = useState<PlanInputs>(defaultPlanInputs);
  const [versions, setVersions] = useState<PlanVersion[]>([]);
  const [assumptionsSummary, setAssumptionsSummary] = useState(
    "Base assumptions for planning discussion.",
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [insights, setInsights] = useState<InsightAlert[]>([]);
  const [netWorth, setNetWorth] = useState<NetWorthRecord | null>(null);
  const [bankCatalog, setBankCatalog] = useState<BankCatalogEntry[]>([]);
  const [bankProfile, setBankProfile] = useState<
    Pick<ClientBankProfile, "primaryBankCode" | "linkedBanks">
  >({
    primaryBankCode: undefined,
    linkedBanks: [],
  });

  const projection = useMemo(() => runProjection(inputs), [inputs]);

  const load = async () => {
    if (!session || !clientId) return;
    const profile = await api.getClientProfile(session, clientId);
    if (profile?.inputs) setInputs(profile.inputs);

    try {
      const insightResponse = await api.getClientInsights(session, clientId);
      setInsights([...insightResponse.computed, ...insightResponse.persisted.filter((p) => !p.resolvedAt)]);
    } catch {
      setInsights([]);
    }

    try {
      const nwRecords = await api.listNetWorthRecords(session, clientId);
      setNetWorth(nwRecords[0] ?? null);
    } catch {
      setNetWorth(null);
    }

    const [catalog, clientBankProfile] = await Promise.all([
      api.bankCatalog(session),
      api.getClientBankProfile(session, clientId),
    ]);
    setBankCatalog(catalog.banks);
    setBankProfile(
      clientBankProfile ?? {
        primaryBankCode: undefined,
        linkedBanks: [],
      },
    );
    const plans = await api.listPlans(session);
    const selected = plans[0] ?? null;
    setActivePlanId(selected?.id ?? null);
    if (selected) {
      const nextVersions = await api.listPlanVersions(session, selected.id);
      setVersions(nextVersions);
    } else {
      setVersions([]);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, clientId]);

  const saveFinancialProfile = async () => {
    if (!session || !clientId) return;
    await api.saveClientProfile(session, clientId, inputs);
    setStatusMessage("Client financial profile saved.");
  };

  const computeNetWorthAction = async () => {
    if (!session || !clientId) return;
    const nw = await api.computeNetWorth(session, clientId);
    setNetWorth(nw);
    setStatusMessage(`Net worth computed: $${nw.netWorth.toLocaleString("en-CA")}`);
  };

  const generateInsights = async () => {
    if (!session || !clientId) return;
    const result = await api.generateInsights(session, clientId);
    setInsights(result.alerts);
    setStatusMessage(`Generated ${result.generated} insight alert(s).`);
  };

  const createOrVersionPlan = async () => {
    if (!session || !clientId) return;
    const clients = await api.listClients(session);
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;

    if (!activePlanId) {
      const created = await api.createPlan(session, {
        title: `${client.fullNameMasked} Retirement Plan`,
        householdId: client.householdId,
        assumptionsSummary,
        inputs,
      });
      setActivePlanId(created.plan.id);
      setVersions([created.version]);
      setStatusMessage("Created plan and initial version.");
      return;
    }

    const next = await api.createPlanVersion(session, activePlanId, {
      title: "Version update",
      householdId: client.householdId,
      assumptionsSummary,
      inputs,
    });
    const nextVersions = await api.listPlanVersions(session, activePlanId);
    setVersions(nextVersions);
    setStatusMessage(`Created version ${next.versionNumber}.`);
  };

  const createScenario = async () => {
    if (!session || !versions[0]) return;
    await api.createScenario(session, {
      planVersionId: versions[0].id,
      name: `Scenario ${new Date().toLocaleTimeString()}`,
      notes: "Generated from current workspace inputs.",
      inputs,
    });
    setStatusMessage("Scenario created for latest version.");
  };

  const toggleBankProduct = (bankCode: string, productCode: string) => {
    setBankProfile((prev) => {
      const linked = [...prev.linkedBanks];
      const idx = linked.findIndex((b) => b.bankCode === bankCode);
      if (idx < 0) {
        linked.push({ bankCode, selectedProductCodes: [productCode] });
      } else {
        const set = new Set(linked[idx].selectedProductCodes);
        if (set.has(productCode)) set.delete(productCode);
        else set.add(productCode);
        if (set.size === 0) linked.splice(idx, 1);
        else linked[idx] = { ...linked[idx], selectedProductCodes: [...set] };
      }
      return { ...prev, linkedBanks: linked };
    });
  };

  const saveBankMapping = async () => {
    if (!session || !clientId) return;
    await api.saveClientBankProfile(session, clientId, bankProfile);
    setStatusMessage("Client bank/product mapping saved.");
  };

  const severityColor = (s: string) =>
    s === "critical" ? "border-red-300 bg-red-50" : s === "warning" ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-slate-50";

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Client workspace</h2>
        <p className="text-sm text-slate-600">
          Financial profile, planning, insights, and institution relationships.
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto_auto]">
          <input
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            value={assumptionsSummary}
            onChange={(e) => setAssumptionsSummary(e.target.value)}
            placeholder="Assumption summary for plan record"
          />
          <button className="rounded bg-slate-800 px-3 py-2 text-sm text-white" onClick={saveFinancialProfile}>
            Save profile
          </button>
          <button className="rounded bg-slate-900 px-3 py-2 text-sm text-white" onClick={createOrVersionPlan}>
            {activePlanId ? "Create version" : "Create plan"}
          </button>
          <button className="rounded bg-slate-700 px-3 py-2 text-sm text-white" onClick={createScenario} disabled={!versions[0]}>
            Add scenario
          </button>
          <button className="rounded bg-emerald-700 px-3 py-2 text-sm text-white" onClick={computeNetWorthAction}>
            Compute net worth
          </button>
        </div>
        {statusMessage && <p className="mt-2 text-sm text-emerald-700">{statusMessage}</p>}
      </div>

      {/* Net Worth Summary */}
      {netWorth && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-sm">
          <h3 className="font-semibold text-slate-900">Net Worth Statement</h3>
          <div className="mt-2 grid gap-3 text-sm sm:grid-cols-3">
            <div><span className="text-slate-500">Total Assets:</span> <span className="font-medium">${netWorth.totalAssets.toLocaleString("en-CA")}</span></div>
            <div><span className="text-slate-500">Total Liabilities:</span> <span className="font-medium">${netWorth.totalLiabilities.toLocaleString("en-CA")}</span></div>
            <div><span className="text-slate-500">Net Worth:</span> <span className="text-lg font-semibold">${netWorth.netWorth.toLocaleString("en-CA")}</span></div>
          </div>
          <p className="mt-1 text-xs text-slate-500">Computed {new Date(netWorth.computedAt).toLocaleString()}</p>
        </div>
      )}

      {/* Insights Engine (PRD §4.8) */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Insights (Internal Only)</h3>
          <button className="rounded bg-slate-900 px-3 py-2 text-sm text-white" onClick={generateInsights}>
            Generate insights
          </button>
        </div>
        <p className="mb-3 text-xs text-slate-500">
          Insights are internal-only advisory signals. Not client-facing unless advisor-approved.
        </p>
        <div className="space-y-2">
          {insights.map((a, idx) => (
            <div key={a.id ?? idx} className={`rounded border p-3 ${severityColor(a.severity)}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{a.title}</span>
                <span className={`text-xs font-semibold uppercase ${a.severity === "critical" ? "text-red-700" : a.severity === "warning" ? "text-amber-700" : "text-slate-500"}`}>
                  {a.severity}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-700">{a.description}</p>
              <p className="mt-1 text-xs text-slate-400">{a.category}</p>
            </div>
          ))}
          {insights.length === 0 && <p className="text-sm text-slate-500">No insight alerts. Generate to analyze.</p>}
        </div>
      </div>

      <ProfileForm value={inputs.profile} onChange={(profile) => setInputs((i) => ({ ...i, profile }))} />
      <IncomeExpenseForm value={inputs.incomeExpense} onChange={(incomeExpense) => setInputs((i) => ({ ...i, incomeExpense }))} />
      <RegisteredAccountsForm accounts={inputs.registered} onChange={(registered) => setInputs((i) => ({ ...i, registered }))} />
      <NonRegisteredForm accounts={inputs.nonRegistered} onChange={(nonRegistered) => setInputs((i) => ({ ...i, nonRegistered }))} />
      <AssetsForm assets={inputs.assets} onChange={(assets) => setInputs((i) => ({ ...i, assets }))} />
      <LiabilitiesForm liabilities={inputs.liabilities} onChange={(liabilities) => setInputs((i) => ({ ...i, liabilities }))} />
      <AssumptionsForm value={inputs.assumptions} onChange={(assumptions) => setInputs((i) => ({ ...i, assumptions }))} />
      <ResultsView projection={projection} retirementAge={inputs.profile.retirementAge} />

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="font-semibold text-slate-900">Version history</h3>
        <ul className="mt-2 space-y-2 text-sm text-slate-700">
          {versions.map((v) => (
            <li key={v.id} className="rounded border border-slate-100 bg-slate-50 px-3 py-2">
              Version {v.versionNumber} - {new Date(v.createdAt).toLocaleString()} - {v.assumptionsSummary}
            </li>
          ))}
          {versions.length === 0 && <li>No versions yet.</li>}
        </ul>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Bank product mapping</h3>
          <button className="rounded bg-slate-900 px-3 py-2 text-sm text-white" onClick={saveBankMapping}>
            Save bank mapping
          </button>
        </div>
        <label className="mb-4 block">
          <span className="text-sm text-slate-600">Primary bank</span>
          <select
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            value={bankProfile.primaryBankCode ?? ""}
            onChange={(e) => setBankProfile((p) => ({ ...p, primaryBankCode: e.target.value || undefined }))}
          >
            <option value="">Select primary bank</option>
            {bankCatalog.map((b) => (
              <option key={b.bankCode} value={b.bankCode}>
                {b.bankName} ({b.institutionType})
              </option>
            ))}
          </select>
        </label>
        <div className="space-y-3">
          {bankCatalog.map((bank) => {
            const selected =
              bankProfile.linkedBanks.find((b) => b.bankCode === bank.bankCode)
                ?.selectedProductCodes ?? [];
            return (
              <details key={bank.bankCode} className="rounded border border-slate-200 bg-slate-50/60 p-3">
                <summary className="cursor-pointer text-sm font-medium text-slate-900">
                  {bank.bankName} ({bank.institutionType})
                </summary>
                <p className="mt-1 text-xs text-slate-500">{bank.website}</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {bank.products.map((p) => (
                    <label
                      key={`${bank.bankCode}-${p.productCode}`}
                      className="flex items-center gap-2 rounded border border-slate-200 bg-white px-2 py-1.5 text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={selected.includes(p.productCode)}
                        onChange={() => toggleBankProduct(bank.bankCode, p.productCode)}
                      />
                      <span>
                        {p.name} <span className="text-slate-500">({p.category})</span>
                      </span>
                    </label>
                  ))}
                </div>
              </details>
            );
          })}
          {bankCatalog.length === 0 && <p className="text-sm text-slate-500">No bank catalog loaded.</p>}
        </div>
      </div>
    </section>
  );
}
