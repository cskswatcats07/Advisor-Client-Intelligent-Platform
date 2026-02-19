import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

interface PortalPayload {
  disclaimer: string;
  client: { fullNameMasked: string };
  latestPlan: { title: string; status: string; updatedAt: string } | null;
  latestVersion:
    | {
        versionNumber: number;
        assumptionsSummary: string;
        createdAt: string;
      }
    | null;
}

export function PortalViewPage() {
  const { token = "" } = useParams();
  const [data, setData] = useState<PortalPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/api/portal/view/${token}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(await res.text());
        }
        return res.json();
      })
      .then((json: PortalPayload) => setData(json))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load portal view."),
      );
  }, [token]);

  if (error) {
    return (
      <div className="mx-auto mt-10 max-w-2xl rounded-xl border border-red-200 bg-white p-6 text-red-700">
        {error}
      </div>
    );
  }
  if (!data) {
    return (
      <div className="mx-auto mt-10 max-w-2xl rounded-xl border border-slate-200 bg-white p-6 text-slate-700">
        Loading client portal...
      </div>
    );
  }

  return (
    <div className="mx-auto mt-6 max-w-3xl space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Client Plan Portal</h1>
      <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
        {data.disclaimer}
      </p>
      <div className="rounded border border-slate-200 p-4">
        <p className="text-sm text-slate-600">Client</p>
        <p className="font-medium text-slate-900">{data.client.fullNameMasked}</p>
      </div>
      <div className="rounded border border-slate-200 p-4">
        <p className="text-sm text-slate-600">Latest plan</p>
        {data.latestPlan ? (
          <>
            <p className="font-medium text-slate-900">{data.latestPlan.title}</p>
            <p className="text-sm text-slate-700">
              Status: {data.latestPlan.status} - Updated{" "}
              {new Date(data.latestPlan.updatedAt).toLocaleString()}
            </p>
          </>
        ) : (
          <p className="text-sm text-slate-700">No plan available yet.</p>
        )}
      </div>
      <div className="rounded border border-slate-200 p-4">
        <p className="text-sm text-slate-600">Latest version</p>
        {data.latestVersion ? (
          <p className="text-sm text-slate-800">
            Version {data.latestVersion.versionNumber}: {data.latestVersion.assumptionsSummary}
          </p>
        ) : (
          <p className="text-sm text-slate-700">No version available yet.</p>
        )}
      </div>
    </div>
  );
}
