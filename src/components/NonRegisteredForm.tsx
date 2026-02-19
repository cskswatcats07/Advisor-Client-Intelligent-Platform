import type { NonRegisteredAccount } from "../types";

interface Props {
  accounts: NonRegisteredAccount[];
  onChange: (a: NonRegisteredAccount[]) => void;
}

export function NonRegisteredForm({ accounts, onChange }: Props) {
  const add = () => {
    onChange([
      ...accounts,
      {
        id: crypto.randomUUID(),
        name: "Non-registered",
        currentBalance: 0,
        taxableYieldPercent: 2,
        growthRatePercent: 4,
      },
    ]);
  };
  const remove = (id: string) => onChange(accounts.filter((a) => a.id !== id));
  const update = (id: string, patch: Partial<NonRegisteredAccount>) =>
    onChange(
      accounts.map((a) => (a.id === id ? { ...a, ...patch } : a))
    );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Non-registered accounts</h2>
        <button
          type="button"
          onClick={add}
          className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700"
        >
          + Add account
        </button>
      </div>
      <p className="mb-4 text-sm text-slate-600">
        Taxable investment accounts. Taxable yield is used for illustrative tax estimates.
      </p>
      <div className="space-y-4">
        {accounts.length === 0 && (
          <p className="text-sm text-slate-500">No non-registered accounts. Add if you have taxable investments.</p>
        )}
        {accounts.map((a) => (
          <div
            key={a.id}
            className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4"
          >
            <label className="min-w-[100px] flex-1">
              <span className="text-xs text-slate-600">Name</span>
              <input
                value={a.name}
                onChange={(e) => update(a.id, { name: e.target.value })}
                className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="w-28">
              <span className="text-xs text-slate-600">Balance ($)</span>
              <input
                type="number"
                min={0}
                step={1000}
                value={a.currentBalance || ""}
                onChange={(e) => update(a.id, { currentBalance: Number(e.target.value) || 0 })}
                className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="w-24">
              <span className="text-xs text-slate-600">Growth %</span>
              <input
                type="number"
                min={0}
                step={0.5}
                value={a.growthRatePercent ?? 4}
                onChange={(e) => update(a.id, { growthRatePercent: Number(e.target.value) || 4 })}
                className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="w-24">
              <span className="text-xs text-slate-600">Taxable yield %</span>
              <input
                type="number"
                min={0}
                step={0.5}
                value={a.taxableYieldPercent ?? 2}
                onChange={(e) => update(a.id, { taxableYieldPercent: Number(e.target.value) || 2 })}
                className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              />
            </label>
            <button
              type="button"
              onClick={() => remove(a.id)}
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
