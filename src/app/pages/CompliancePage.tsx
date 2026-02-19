import { useEffect, useState } from "react";
import { useAuth } from "../auth";
import { api } from "../../shared/api/client";
import type {
  AuditEvent,
  DisclosureAcceptance,
  PlanApproval,
  RecommendationNote,
} from "../../shared/advisor-types";

export function CompliancePage() {
  const { session } = useAuth();
  const [recommendations, setRecommendations] = useState<RecommendationNote[]>([]);
  const [disclosures, setDisclosures] = useState<DisclosureAcceptance[]>([]);
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const [approvals, setApprovals] = useState<PlanApproval[]>([]);
  const [draft, setDraft] = useState({
    planId: "",
    clientId: "",
    recommendationText: "",
    rationale: "",
    advisorAttested: true,
  });

  const load = async () => {
    if (!session) return;
    const [nextRecommendations, nextDisclosures, nextApprovals] = await Promise.all([
      api.listRecommendations(session),
      api.listDisclosures(session),
      api.listApprovals(session),
    ]);
    setRecommendations(nextRecommendations);
    setDisclosures(nextDisclosures);
    setApprovals(nextApprovals);
    try {
      const nextAudit = await api.listAudit(session);
      setAudit(nextAudit);
    } catch {
      setAudit([]);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const createRecommendation = async () => {
    if (!session) return;
    await api.createRecommendation(session, draft);
    setDraft((s) => ({ ...s, recommendationText: "", rationale: "" }));
    await load();
  };

  const submitApproval = async (planId: string) => {
    if (!session || !planId) return;
    await api.submitApproval(session, { planId, notes: "Submitted for compliance review." });
    await load();
  };

  const decideApproval = async (approvalId: string, status: "approved" | "rejected") => {
    if (!session) return;
    await api.decideApproval(session, { approvalId, status, notes: "Reviewed by compliance." });
    await load();
  };

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Compliance</h2>
        <p className="text-sm text-slate-600">
          Rationale capture, disclosure tracking, and immutable audit visibility.
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="font-semibold text-slate-900">Create recommendation note</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            placeholder="Plan ID"
            value={draft.planId}
            onChange={(e) => setDraft((s) => ({ ...s, planId: e.target.value }))}
          />
          <input
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            placeholder="Client ID"
            value={draft.clientId}
            onChange={(e) => setDraft((s) => ({ ...s, clientId: e.target.value }))}
          />
        </div>
        <textarea
          className="mt-3 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          rows={2}
          placeholder="Recommendation text"
          value={draft.recommendationText}
          onChange={(e) => setDraft((s) => ({ ...s, recommendationText: e.target.value }))}
        />
        <textarea
          className="mt-2 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          rows={2}
          placeholder="Suitability rationale"
          value={draft.rationale}
          onChange={(e) => setDraft((s) => ({ ...s, rationale: e.target.value }))}
        />
        <button
          className="mt-3 rounded bg-slate-900 px-4 py-2 text-sm text-white"
          disabled={!draft.planId || !draft.clientId || !draft.recommendationText || !draft.rationale}
          onClick={createRecommendation}
        >
          Save attested recommendation
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CardList
          title="Recommendation notes"
          items={recommendations.map((r) => `${r.clientId}: ${r.recommendationText}`)}
        />
        <CardList
          title="Disclosures accepted"
          items={disclosures.map((d) => `${d.clientId} - ${d.disclosureType} (${d.acceptedByName})`)}
        />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="font-semibold text-slate-900">Approval workflow</h3>
        <p className="mt-1 text-sm text-slate-600">
          Submit a plan for compliance review and record approve/reject decisions.
        </p>
        <div className="mt-3 flex gap-2">
          <input
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            placeholder="Plan ID"
            value={draft.planId}
            onChange={(e) => setDraft((s) => ({ ...s, planId: e.target.value }))}
          />
          <button className="rounded bg-slate-900 px-3 py-2 text-sm text-white" onClick={() => submitApproval(draft.planId)}>
            Submit
          </button>
        </div>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          {approvals.map((a) => (
            <li key={a.id} className="rounded border border-slate-100 bg-slate-50 px-3 py-2">
              <p>
                Plan {a.planId} - {a.status} - submitted {new Date(a.submittedAt).toLocaleString()}
              </p>
              {a.status === "submitted" && (
                <div className="mt-2 flex gap-2">
                  <button
                    className="rounded bg-emerald-700 px-2 py-1 text-xs text-white"
                    onClick={() => decideApproval(a.id, "approved")}
                  >
                    Approve
                  </button>
                  <button
                    className="rounded bg-red-700 px-2 py-1 text-xs text-white"
                    onClick={() => decideApproval(a.id, "rejected")}
                  >
                    Reject
                  </button>
                </div>
              )}
            </li>
          ))}
          {approvals.length === 0 && <li>No approval records.</li>}
        </ul>
      </div>
      <CardList
        title="Audit trail (latest 30)"
        items={audit.slice(0, 30).map((a) => `${a.createdAt} - ${a.eventType} - ${a.entityType}`)}
      />
    </section>
  );
}

function CardList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <ul className="mt-2 space-y-2 text-sm text-slate-700">
        {items.map((item, idx) => (
          <li key={`${title}-${idx}`} className="rounded border border-slate-100 bg-slate-50 px-3 py-2">
            {item}
          </li>
        ))}
        {items.length === 0 && <li className="text-slate-500">No records yet.</li>}
      </ul>
    </div>
  );
}
