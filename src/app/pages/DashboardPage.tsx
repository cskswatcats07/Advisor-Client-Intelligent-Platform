import { useEffect, useState } from "react";
import { useAuth } from "../auth";
import { api } from "../../shared/api/client";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Metrics {
  clients: number;
  plans: number;
  drafts: number;
  disclosures: number;
  avgFinalNetWorth: number;
  activeInsights: number;
  conflictDisclosures: number;
  pendingControls: number;
}

interface DashboardAnalytics {
  kpis: {
    avgFinalNetWorth: number;
    clientCount: number;
    planCount: number;
    activeInsights: number;
    conflictDisclosures: number;
    pendingControls: number;
  };
  charts: {
    netWorthSeries: Array<{ createdAt: string; finalNetWorth: number; versionId: string }>;
    planStatusBreakdown: Record<string, number>;
    insightsBySeverity: Record<string, number>;
  };
}

export function DashboardPage() {
  const { session } = useAuth();
  const [series, setSeries] = useState<
    Array<{ createdAt: string; finalNetWorth: number; versionId: string }>
  >([]);
  const [statusBreakdown, setStatusBreakdown] = useState<Record<string, number>>({});
  const [insightsBySeverity, setInsightsBySeverity] = useState<Record<string, number>>({});
  const [metrics, setMetrics] = useState<Metrics>({
    clients: 0,
    plans: 0,
    drafts: 0,
    disclosures: 0,
    avgFinalNetWorth: 0,
    activeInsights: 0,
    conflictDisclosures: 0,
    pendingControls: 0,
  });

  useEffect(() => {
    if (!session) return;
    Promise.all([
      api.listClients(session),
      api.listPlans(session),
      api.listAiDrafts(session),
      api.listDisclosures(session),
      api.analyticsDashboard(session) as Promise<DashboardAnalytics>,
    ]).then(([clients, plans, drafts, disclosures, analytics]) => {
      setMetrics({
        clients: clients.length,
        plans: plans.length,
        drafts: drafts.length,
        disclosures: disclosures.length,
        avgFinalNetWorth: analytics.kpis.avgFinalNetWorth,
        activeInsights: analytics.kpis.activeInsights ?? 0,
        conflictDisclosures: analytics.kpis.conflictDisclosures ?? 0,
        pendingControls: analytics.kpis.pendingControls ?? 0,
      });
      setSeries(analytics.charts.netWorthSeries);
      setStatusBreakdown(analytics.charts.planStatusBreakdown);
      setInsightsBySeverity(analytics.charts.insightsBySeverity ?? {});
    });
  }, [session]);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Dashboard</h2>
        <p className="text-sm text-slate-600">
          Practice-wide snapshot: clients, plans, insights, compliance, and audit metrics.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Clients" value={metrics.clients} />
        <MetricCard title="Plans" value={metrics.plans} />
        <MetricCard title="Active Insights" value={metrics.activeInsights} highlight={metrics.activeInsights > 0} />
        <MetricCard title="Conflict Disclosures" value={metrics.conflictDisclosures} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="AI Drafts" value={metrics.drafts} />
        <MetricCard title="Disclosures" value={metrics.disclosures} />
        <MetricCard title="Pending Controls" value={metrics.pendingControls} highlight={metrics.pendingControls > 0} />
        <MetricCard title="Avg Final Net Worth" value={Math.round(metrics.avgFinalNetWorth)} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-2 text-sm text-slate-600">Plan status breakdown</p>
          <div className="space-y-1 text-sm">
            {Object.entries(statusBreakdown).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="capitalize">{status}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
            {Object.keys(statusBreakdown).length === 0 && <p>No plan data yet.</p>}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-2 text-sm text-slate-600">Insight alerts by severity</p>
          <div className="space-y-1 text-sm">
            {Object.entries(insightsBySeverity).map(([severity, count]) => (
              <div key={severity} className="flex items-center justify-between">
                <span className={`capitalize ${severity === "critical" ? "text-red-600 font-semibold" : severity === "warning" ? "text-amber-600" : ""}`}>
                  {severity}
                </span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
            {Object.keys(insightsBySeverity).length === 0 && <p>No active insight alerts.</p>}
          </div>
        </div>
      </div>
      <div className="h-72 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="mb-2 text-sm text-slate-600">Net worth trend by version</p>
        <ResponsiveContainer width="100%" height="90%">
          <LineChart data={series}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="createdAt"
              tickFormatter={(v) => new Date(v).toLocaleDateString()}
            />
            <YAxis tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
            <Tooltip
              labelFormatter={(v) => new Date(v).toLocaleString()}
              formatter={(v) =>
                v != null
                  ? `$${Number(v).toLocaleString("en-CA", {
                      maximumFractionDigits: 0,
                    })}`
                  : "$0"
              }
            />
            <Line type="monotone" dataKey="finalNetWorth" stroke="#0f172a" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <p className="font-semibold">ACIP Operating Model</p>
        <p className="mt-1">
          Compliance-first advisory infrastructure. AI outputs remain draft-only until advisor edit and attestation.
          Insights are internal-only signals not shared with clients unless advisor-approved.
          All recommendations capture a suitability snapshot at creation time.
        </p>
      </div>
    </section>
  );
}

function MetricCard({ title, value, highlight }: { title: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${highlight ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white"}`}>
      <p className="text-sm text-slate-600">{title}</p>
      <p className={`mt-1 text-2xl font-semibold ${highlight ? "text-amber-700" : "text-slate-900"}`}>{value}</p>
    </div>
  );
}
