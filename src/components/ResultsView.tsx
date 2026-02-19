import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from "recharts";
import type { ProjectionYear } from "../types";
import { Disclaimer } from "./Disclaimer";

interface Props {
  projection: ProjectionYear[];
  retirementAge: number;
}

export function ResultsView({ projection, retirementAge }: Props) {
  if (projection.length === 0) return null;

  const atRetirement = projection.find((y) => y.age === retirementAge);
  const last = projection[projection.length - 1];
  const chartData = projection.map((y) => ({
    age: y.age,
    "Net worth": Math.round(y.netWorth),
    RRSP: Math.round(y.rrspBalance),
    TFSA: Math.round(y.tfsaBalance),
    "Non-reg": Math.round(y.nonRegisteredBalance),
    Expenses: Math.round(y.expenses),
    Tax: Math.round(y.estimatedTax),
  }));

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-800">Projection (illustrative)</h2>
      <Disclaimer />
      <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-sm text-slate-600">Net worth today</p>
          <p className="text-xl font-semibold text-slate-900">
            ${(projection[0]?.netWorth ?? 0).toLocaleString("en-CA", { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-sm text-slate-600">At retirement (age {retirementAge})</p>
          <p className="text-xl font-semibold text-slate-900">
            ${(atRetirement?.netWorth ?? 0).toLocaleString("en-CA", { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-sm text-slate-600">At age {last?.age}</p>
          <p className="text-xl font-semibold text-slate-900">
            ${(last?.netWorth ?? 0).toLocaleString("en-CA", { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-sm text-slate-600">Annual expenses (final year)</p>
          <p className="text-xl font-semibold text-slate-900">
            ${(last?.expenses ?? 0).toLocaleString("en-CA", { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>
      <div className="mt-6 h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="age" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(v) => `$${v / 1000}k`} tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(v) =>
                v != null ? [`$${Number(v).toLocaleString("en-CA", { maximumFractionDigits: 0 })}`, ""] : []
              }
              labelFormatter={(age) => `Age ${age}`}
            />
            <Legend />
            <Area type="monotone" dataKey="Net worth" fill="#0f172a" fillOpacity={0.2} stroke="#0f172a" strokeWidth={2} />
            <Line type="monotone" dataKey="RRSP" stroke="#c41e3a" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="TFSA" stroke="#2563eb" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="Non-reg" stroke="#16a34a" strokeWidth={1.5} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Projections are illustrative only. They depend on your inputs and assumptions and are not a guarantee of future results. Seek professional advice.
      </p>
    </section>
  );
}
