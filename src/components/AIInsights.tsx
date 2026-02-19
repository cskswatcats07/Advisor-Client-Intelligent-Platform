/**
 * AI augmentation: explanatory content only. Does not give advice or recommendations.
 * Suggests topics to discuss with a qualified professional.
 */

import { useState } from "react";
import type { PlanInputs, ProjectionYear } from "../types";

const TOPICS = [
  "How RRSP contributions reduce taxable income and affect my tax refund",
  "When to start CPP and OAS and how that affects my retirement income",
  "Tax-efficient withdrawal order for RRSP, TFSA, and non-registered accounts",
  "How inflation might affect my future expenses and savings",
  "Whether my current savings rate is on track for my goals",
  "How registered account contribution limits (RRSP, TFSA, FHSA) apply to my situation",
  "Estate planning and tax implications of registered accounts",
  "How depreciation and amortization affect my net worth over time",
];

const EXPLAIN: Record<string, string> = {
  RRSP: "An RRSP is a registered retirement savings plan. Contributions are tax-deductible and growth is tax-deferred. Withdrawals are taxable. Limits are set by the CRA (e.g., 18% of prior year earned income, up to an annual cap). This tool does not advise how much to contribute.",
  TFSA: "A TFSA is a tax-free savings account. Contributions are not deductible, but growth and withdrawals are tax-free. Contribution room accumulates if unused. Limits are set by the federal government each year. This tool does not advise how much to contribute.",
  FHSA: "The First Home Savings Account helps Canadians save for a first home. Contributions are tax-deductible and withdrawals for a qualifying first home are tax-free. Annual and lifetime limits apply. This tool does not advise whether an FHSA is right for you.",
  inflation: "Inflation is the rate at which prices increase over time. Projections often assume future expenses grow with inflation. Actual inflation varies. This tool uses your assumed rate for illustration only.",
  withdrawal: "The order in which you withdraw from RRSP/RRIF, TFSA, and non-registered accounts can affect taxes and benefits (e.g., OAS clawback). Strategies depend on your situation. A licensed advisor can help optimize.",
};

interface Props {
  inputs: PlanInputs;
  projection: ProjectionYear[];
}

export function AIInsights({ inputs: _inputs, projection: _projection }: Props) {
  const [query, setQuery] = useState("");
  const [explanation, setExplanation] = useState<string | null>(null);

  const handleAsk = () => {
    const q = query.toLowerCase();
    if (q.includes("rrsp")) setExplanation(EXPLAIN.RRSP);
    else if (q.includes("tfsa")) setExplanation(EXPLAIN.TFSA);
    else if (q.includes("fhsa")) setExplanation(EXPLAIN.FHSA);
    else if (q.includes("inflation")) setExplanation(EXPLAIN.inflation);
    else if (q.includes("withdraw") || q.includes("order")) setExplanation(EXPLAIN.withdrawal);
    else setExplanation("You can ask about RRSP, TFSA, FHSA, inflation, or withdrawal order. This tool only explains concepts; it does not give personalized advice. For advice, please consult a qualified professional.");
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-2 text-lg font-semibold text-slate-800">Learn more (educational only)</h2>
      <p className="mb-4 text-sm text-slate-600">
        This section explains general concepts only. It does not provide advice, recommendations, or act as an advisor or banking agent.
      </p>
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="e.g. What is an RRSP?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAsk()}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={handleAsk}
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-white hover:bg-slate-700"
        >
          Explain
        </button>
      </div>
      {explanation && (
        <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-sm text-slate-700">
          {explanation}
        </div>
      )}
      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">Topics you may want to discuss with a qualified professional</p>
        <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
          {TOPICS.slice(0, 6).map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
