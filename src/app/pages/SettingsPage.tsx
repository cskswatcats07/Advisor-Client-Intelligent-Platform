import { useEffect, useState } from "react";
import { useAuth } from "../auth";
import { api } from "../../shared/api/client";
import type { AiDraft } from "../../shared/advisor-types";

export function SettingsPage() {
  const { session, user } = useAuth();
  const [drafts, setDrafts] = useState<AiDraft[]>([]);
  const [prompt, setPrompt] = useState("");
  const [draftType, setDraftType] = useState<
    "meeting_summary" | "scenario_explanation" | "compliance_check"
  >("meeting_summary");
  const [clientId, setClientId] = useState("");
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [editedOutput, setEditedOutput] = useState("");
  const [reportClientId, setReportClientId] = useState("");
  const [reportJson, setReportJson] = useState("");
  const [portalUrl, setPortalUrl] = useState("");
  const [twoFaUserId, setTwoFaUserId] = useState("");
  const [twoFaChallengeId, setTwoFaChallengeId] = useState("");
  const [twoFaOtp, setTwoFaOtp] = useState("");
  const [twoFaDevOtpPreview, setTwoFaDevOtpPreview] = useState("");

  const loadDrafts = async () => {
    if (!session) return;
    const next = await api.listAiDrafts(session);
    setDrafts(next);
  };

  useEffect(() => {
    void loadDrafts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const createDraft = async () => {
    if (!session) return;
    await api.createAiDraft(session, {
      clientId: clientId || undefined,
      prompt,
      draftType,
    });
    setPrompt("");
    await loadDrafts();
  };

  const startEdit = (draft: AiDraft) => {
    setEditingDraftId(draft.id);
    setEditedOutput(draft.output);
  };

  const saveEdit = async () => {
    if (!session || !editingDraftId) return;
    await api.editAiDraft(session, editingDraftId, editedOutput);
    setEditingDraftId(null);
    setEditedOutput("");
    await loadDrafts();
  };

  const attestDraft = async (draftId: string) => {
    if (!session || !user) return;
    try {
      await api.attestAiDraft(session, draftId, user.id);
      await loadDrafts();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Attestation failed.");
    }
  };

  const getClientReport = async () => {
    if (!session || !reportClientId) return;
    const report = await api.reportSummary(session, reportClientId);
    setReportJson(JSON.stringify(report, null, 2));
  };

  const createPortalLink = async () => {
    if (!session || !reportClientId) return;
    const result = await api.createPortalSession(session, {
      clientId: reportClientId,
      expiresInHours: 72,
    });
    setPortalUrl(`${window.location.origin}/portal/${result.token}`);
  };

  const start2fa = async () => {
    if (!session || !twoFaUserId) return;
    const result = (await api.start2fa(
      session,
      twoFaUserId,
      "settings-sensitive-operation",
    )) as { challengeId: string; otpPreviewForDevOnly?: string };
    setTwoFaChallengeId(result.challengeId);
    setTwoFaDevOtpPreview(result.otpPreviewForDevOnly ?? "");
  };

  const verify2fa = async () => {
    if (!session || !twoFaChallengeId || !twoFaUserId || !twoFaOtp) return;
    await api.verify2fa(session, twoFaChallengeId, twoFaUserId, twoFaOtp);
    setTwoFaOtp("");
  };

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Settings & AI Copilot</h2>
        <p className="text-sm text-slate-600">
          Draft-only AI workflows with mandatory edit-before-attestation. Client reporting and portal controls.
        </p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900">
        <p className="font-semibold">AI Copilot Safeguards (PRD §4.7)</p>
        <ul className="mt-1 list-inside list-disc">
          <li>All AI output includes a hallucination disclaimer</li>
          <li>Advisor must edit the draft before attestation is permitted</li>
          <li>No direct client publishing of AI-generated content</li>
          <li>Prompt and output are immutably logged in the audit trail</li>
        </ul>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="font-semibold text-slate-900">Create AI draft</h3>
        <div className="mt-3 grid gap-3 lg:grid-cols-4">
          <select
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            value={draftType}
            onChange={(e) =>
              setDraftType(e.target.value as typeof draftType)
            }
          >
            <option value="meeting_summary">Meeting Summary</option>
            <option value="scenario_explanation">Scenario Explanation</option>
            <option value="compliance_check">Compliance Check</option>
          </select>
          <input
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            placeholder="Client ID (optional)"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          />
          <input
            className="rounded border border-slate-300 px-3 py-2 text-sm lg:col-span-2"
            placeholder="Prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>
        <button
          className="mt-3 rounded bg-slate-900 px-4 py-2 text-sm text-white"
          onClick={createDraft}
          disabled={!prompt}
        >
          Generate draft
        </button>
        <ul className="mt-4 space-y-2 text-sm">
          {drafts.map((d) => (
            <li key={d.id} className="rounded border border-slate-100 bg-slate-50 px-3 py-2">
              <div className="flex items-center gap-2">
                <p className="font-medium">{d.draftType}</p>
                {d.attestedAt && <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">Attested</span>}
                {d.advisorEdited && !d.attestedAt && <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800">Edited</span>}
                {!d.advisorEdited && !d.attestedAt && <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">Needs edit</span>}
              </div>
              {editingDraftId === d.id ? (
                <div className="mt-2">
                  <textarea
                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                    rows={6}
                    value={editedOutput}
                    onChange={(e) => setEditedOutput(e.target.value)}
                  />
                  <div className="mt-2 flex gap-2">
                    <button className="rounded bg-blue-700 px-3 py-1 text-xs text-white" onClick={saveEdit}>
                      Save edit
                    </button>
                    <button className="rounded bg-slate-400 px-3 py-1 text-xs text-white" onClick={() => setEditingDraftId(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-1 whitespace-pre-wrap text-slate-700">{d.output}</p>
              )}
              <div className="mt-2 flex gap-2">
                {!d.attestedAt && editingDraftId !== d.id && (
                  <button
                    className="rounded bg-blue-700 px-3 py-1 text-xs text-white"
                    onClick={() => startEdit(d)}
                  >
                    Edit draft
                  </button>
                )}
                {d.advisorEdited && !d.attestedAt && (
                  <button
                    className="rounded bg-slate-800 px-3 py-1 text-xs text-white"
                    onClick={() => attestDraft(d.id)}
                  >
                    Attest draft
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="font-semibold text-slate-900">Client reporting & portal</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            placeholder="Client ID"
            value={reportClientId}
            onChange={(e) => setReportClientId(e.target.value)}
          />
          <button className="rounded bg-slate-900 px-3 py-2 text-sm text-white" onClick={getClientReport}>
            Generate summary
          </button>
          <button className="rounded bg-slate-700 px-3 py-2 text-sm text-white" onClick={createPortalLink}>
            Create portal link
          </button>
        </div>
        {portalUrl && (
          <p className="mt-2 text-sm text-slate-700">
            Portal URL: <a className="underline" href={portalUrl}>{portalUrl}</a>
          </p>
        )}
        {reportJson && (
          <pre className="mt-3 max-h-72 overflow-auto rounded bg-slate-900 p-3 text-xs text-slate-100">
            {reportJson}
          </pre>
        )}
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="font-semibold text-slate-900">2-Factor authentication engine</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            placeholder="User ID"
            value={twoFaUserId}
            onChange={(e) => setTwoFaUserId(e.target.value)}
          />
          <button className="rounded bg-slate-900 px-3 py-2 text-sm text-white" onClick={start2fa}>
            Start challenge
          </button>
          <input
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            placeholder="OTP"
            value={twoFaOtp}
            onChange={(e) => setTwoFaOtp(e.target.value)}
          />
          <button className="rounded bg-slate-700 px-3 py-2 text-sm text-white" onClick={verify2fa}>
            Verify
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-600">
          Challenge ID: {twoFaChallengeId || "Not started"}{" "}
          {twoFaDevOtpPreview ? `| Dev OTP preview: ${twoFaDevOtpPreview}` : ""}
        </p>
      </div>
    </section>
  );
}
