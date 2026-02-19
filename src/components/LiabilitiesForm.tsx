import type { Liability } from "../types";

interface Props {
  liabilities: Liability[];
  onChange: (l: Liability[]) => void;
}

export function LiabilitiesForm({ liabilities, onChange }: Props) {
  const add = () => {
    onChange([
      ...liabilities,
      {
        id: crypto.randomUUID(),
        name: "New debt",
        balance: 0,
        interestRatePercent: 5,
        minimumMonthlyPayment: 0,
      },
    ]);
  };
  const remove = (id: string) => onChange(liabilities.filter((l) => l.id !== id));
  const update = (id: string, patch: Partial<Liability>) =>
    onChange(
      liabilities.map((l) => (l.id === id ? { ...l, ...patch } : l))
    );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Liabilities</h2>
        <button
          type="button"
          onClick={add}
          className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700"
        >
          + Add liability
        </button>
      </div>
      <p className="mb-4 text-sm text-slate-600">
        Mortgages, loans, credit cards. Amortization years optional for display.
      </p>
      <div className="space-y-4">
        {liabilities.length === 0 && (
          <p className="text-sm text-slate-500">No liabilities entered.</p>
        )}
        {liabilities.map((l) => (
          <div
            key={l.id}
            className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4"
          >
            <label className="min-w-[100px] flex-1">
              <span className="text-xs text-slate-600">Name</span>
              <input
                value={l.name}
                onChange={(e) => update(l.id, { name: e.target.value })}
                className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="w-28">
              <span className="text-xs text-slate-600">Balance ($)</span>
              <input
                type="number"
                min={0}
                step={1000}
                value={l.balance || ""}
                onChange={(e) => update(l.id, { balance: Number(e.target.value) || 0 })}
                className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="w-24">
              <span className="text-xs text-slate-600">Rate %</span>
              <input
                type="number"
                min={0}
                step={0.25}
                value={l.interestRatePercent ?? ""}
                onChange={(e) => update(l.id, { interestRatePercent: Number(e.target.value) || 0 })}
                className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="w-28">
              <span className="text-xs text-slate-600">Min payment/mo ($)</span>
              <input
                type="number"
                min={0}
                step={50}
                value={l.minimumMonthlyPayment ?? ""}
                onChange={(e) => update(l.id, { minimumMonthlyPayment: Number(e.target.value) || 0 })}
                className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="w-24">
              <span className="text-xs text-slate-600">Amort. (y)</span>
              <input
                type="number"
                min={0}
                placeholder="—"
                value={l.amortizationYears ?? ""}
                onChange={(e) =>
                  update(l.id, {
                    amortizationYears: e.target.value === "" ? undefined : Number(e.target.value),
                  })
                }
                className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              />
            </label>
            <button
              type="button"
              onClick={() => remove(l.id)}
              className="rounded border border-red-200 px-2 py-1.5 text-sm text-red-600 hover:bg-red-50"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
