import type { RegisteredAccount } from "../types";
import {
  RRSP_DOLLAR_LIMIT_2025,
  TFSA_ANNUAL_LIMIT_2025,
  FHSA_ANNUAL_LIMIT_2025,
  CURRENT_YEAR,
} from "../data/canada";

interface Props {
  accounts: RegisteredAccount[];
  onChange: (a: RegisteredAccount[]) => void;
}

export function RegisteredAccountsForm({ accounts, onChange }: Props) {
  const update = (type: "RRSP" | "TFSA" | "FHSA", patch: Partial<RegisteredAccount>) => {
    const next = accounts.map((a) =>
      a.type === type ? { ...a, ...patch } : a
    );
    if (!next.some((a) => a.type === type)) {
      next.push({ type, currentBalance: 0, annualContribution: 0, growthRatePercent: 5, ...patch } as RegisteredAccount);
    }
    onChange(next);
  };

  const get = (type: "RRSP" | "TFSA" | "FHSA") =>
    accounts.find((a) => a.type === type) ?? {
      type,
      currentBalance: 0,
      annualContribution: 0,
      growthRatePercent: 5,
    };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-800">Registered & non-registered accounts</h2>
      <p className="mb-4 text-sm text-slate-600">
        Balances and annual contributions. Limits shown are for illustration only (e.g. {CURRENT_YEAR}); verify with CRA.
      </p>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* RRSP */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
          <h3 className="font-medium text-slate-800">RRSP</h3>
          <p className="text-xs text-slate-500">Limit: up to {RRSP_DOLLAR_LIMIT_2025.toLocaleString()} (2025 cap)</p>
          <label className="mt-2 block text-sm text-slate-600">Current balance ($)</label>
          <input
            type="number"
            min={0}
            step={1000}
            value={get("RRSP").currentBalance || ""}
            onChange={(e) => update("RRSP", { currentBalance: Number(e.target.value) || 0 })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <label className="mt-2 block text-sm text-slate-600">Annual contribution ($)</label>
          <input
            type="number"
            min={0}
            step={1000}
            value={get("RRSP").annualContribution || ""}
            onChange={(e) => update("RRSP", { annualContribution: Number(e.target.value) || 0 })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <label className="mt-2 block text-sm text-slate-600">Growth assumption (%)</label>
          <input
            type="number"
            min={0}
            step={0.5}
            value={get("RRSP").growthRatePercent ?? 5}
            onChange={(e) => update("RRSP", { growthRatePercent: Number(e.target.value) || 5 })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        {/* TFSA */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
          <h3 className="font-medium text-slate-800">TFSA</h3>
          <p className="text-xs text-slate-500">Annual room: {TFSA_ANNUAL_LIMIT_2025.toLocaleString()} (2025)</p>
          <label className="mt-2 block text-sm text-slate-600">Current balance ($)</label>
          <input
            type="number"
            min={0}
            step={1000}
            value={get("TFSA").currentBalance || ""}
            onChange={(e) => update("TFSA", { currentBalance: Number(e.target.value) || 0 })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <label className="mt-2 block text-sm text-slate-600">Annual contribution ($)</label>
          <input
            type="number"
            min={0}
            step={1000}
            value={get("TFSA").annualContribution || ""}
            onChange={(e) => update("TFSA", { annualContribution: Number(e.target.value) || 0 })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <label className="mt-2 block text-sm text-slate-600">Growth assumption (%)</label>
          <input
            type="number"
            min={0}
            step={0.5}
            value={get("TFSA").growthRatePercent ?? 5}
            onChange={(e) => update("TFSA", { growthRatePercent: Number(e.target.value) || 5 })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        {/* FHSA */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
          <h3 className="font-medium text-slate-800">FHSA</h3>
          <p className="text-xs text-slate-500">Annual room: {FHSA_ANNUAL_LIMIT_2025.toLocaleString()} (2025)</p>
          <label className="mt-2 block text-sm text-slate-600">Current balance ($)</label>
          <input
            type="number"
            min={0}
            step={1000}
            value={get("FHSA").currentBalance || ""}
            onChange={(e) => update("FHSA", { currentBalance: Number(e.target.value) || 0 })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <label className="mt-2 block text-sm text-slate-600">Annual contribution ($)</label>
          <input
            type="number"
            min={0}
            step={1000}
            value={get("FHSA").annualContribution || ""}
            onChange={(e) => update("FHSA", { annualContribution: Number(e.target.value) || 0 })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <label className="mt-2 block text-sm text-slate-600">Growth assumption (%)</label>
          <input
            type="number"
            min={0}
            step={0.5}
            value={get("FHSA").growthRatePercent ?? 5}
            onChange={(e) => update("FHSA", { growthRatePercent: Number(e.target.value) || 5 })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
      </div>
    </section>
  );
}
