import { useEffect, useState } from "react";
import { useAuth } from "../auth";
import { api } from "../../shared/api/client";
import type { ConflictDisclosure } from "../../shared/advisor-types";

export function EthicsPage() {
  const { session } = useAuth();
  const [disclosures, setDisclosures] = useState<ConflictDisclosure[]>([]);
  const [form, setForm] = useState({
    clientId: "",
    conflictType: "compensation" as ConflictDisclosure["conflictType"],
    description: "",
    mitigationStrategy: "",
  });
  const [transparencyClientId, setTransparencyClientId] = useState("");
  const [transparencyData, setTransparencyData] = useState<Record<string, unknown> | null>(null);

  const load = async () => {
    if (!session) return;
    const next = await api.listConflictDisclosures(session);
    setDisclosures(next);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const submit = async () => {
    if (!session) return;
    await api.createConflictDisclosure(session, {
      clientId: form.clientId || undefined,
      conflictType: form.conflictType,
      description: form.description,
      mitigationStrategy: form.mitigationStrategy,
    });
    setForm((s) => ({ ...s, description: "", mitigationStrategy: "" }));
    await load();
  };

  const loadTransparency = async () => {
    if (!session || !transparencyClientId) return;
    const data = (await api.getTransparencyDashboard(session, transparencyClientId)) as Record<string, unknown>;
    setTransparencyData(data);
  };

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Ethical Guardrails</h2>
        <p className="text-sm text-slate-600">
          Conflict-of-interest disclosures, advisor attestation tracking, and client transparency dashboard.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="font-semibold text-slate-900">File conflict disclosure</h3>
        <p className="mt-1 text-xs text-slate-500">
          Required: disclose compensation conflicts, referral arrangements, proprietary product biases, or dual roles.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            placeholder="Client ID (optional — leave blank for org-wide)"
            value={form.clientId}
            onChange={(e) => setForm((s) => ({ ...s, clientId: e.target.value }))}
          />
          <select
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            value={form.conflictType}
            onChange={(e) => setForm((s) => ({ ...s, conflictType: e.target.value as ConflictDisclosure["conflictType"] }))}
          >
            <option value="compensation">Compensation</option>
            <option value="referral">Referral</option>
            <option value="proprietary_product">Proprietary Product</option>
            <option value="dual_role">Dual Role</option>
            <option value="other">Other</option>
          </select>
        </div>
        <textarea
          className="mt-3 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          rows={2}
          placeholder="Describe the conflict"
          value={form.description}
          onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
        />
        <textarea
          className="mt-2 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          rows={2}
          placeholder="Mitigation strategy"
          value={form.mitigationStrategy}
          onChange={(e) => setForm((s) => ({ ...s, mitigationStrategy: e.target.value }))}
        />
        <button
          className="mt-3 rounded bg-slate-900 px-4 py-2 text-sm text-white"
          disabled={!form.description || !form.mitigationStrategy}
          onClick={submit}
        >
          File disclosure
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="font-semibold text-slate-900">Conflict disclosures on file</h3>
        <ul className="mt-2 space-y-2 text-sm">
          {disclosures.map((d) => (
            <li key={d.id} className="rounded border border-slate-100 bg-slate-50 px-3 py-2">
              <p className="font-medium capitalize">{d.conflictType}{d.clientId ? ` — Client ${d.clientId}` : " (org-wide)"}</p>
              <p className="mt-1 text-slate-700">{d.description}</p>
              <p className="mt-1 text-xs text-slate-500">Mitigation: {d.mitigationStrategy}</p>
              <p className="mt-1 text-xs text-slate-400">Filed {new Date(d.disclosedAt).toLocaleString()}</p>
            </li>
          ))}
          {disclosures.length === 0 && <li className="text-slate-500">No conflict disclosures on file.</li>}
        </ul>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="font-semibold text-slate-900">Client transparency dashboard</h3>
        <p className="mt-1 text-xs text-slate-500">
          View a summary of conflicts, consent status, and disclosure tracking for a specific client.
        </p>
        <div className="mt-3 flex gap-2">
          <input
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            placeholder="Client ID"
            value={transparencyClientId}
            onChange={(e) => setTransparencyClientId(e.target.value)}
          />
          <button className="rounded bg-slate-900 px-3 py-2 text-sm text-white" onClick={loadTransparency}>
            Load transparency
          </button>
        </div>
        {transparencyData && (
          <pre className="mt-3 max-h-60 overflow-auto rounded bg-slate-900 p-3 text-xs text-slate-100">
            {JSON.stringify(transparencyData, null, 2)}
          </pre>
        )}
      </div>
    </section>
  );
}
