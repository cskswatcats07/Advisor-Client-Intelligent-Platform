import type { Asset, AssetCategory } from "../types";

const CATEGORIES: AssetCategory[] = ["cash", "investments", "real_estate", "vehicle", "other"];

interface Props {
  assets: Asset[];
  onChange: (a: Asset[]) => void;
}

export function AssetsForm({ assets, onChange }: Props) {
  const add = () => {
    onChange([
      ...assets,
      {
        id: crypto.randomUUID(),
        name: "New asset",
        category: "investments",
        currentValue: 0,
        annualGrowthRatePercent: 4,
      },
    ]);
  };
  const remove = (id: string) => onChange(assets.filter((a) => a.id !== id));
  const update = (id: string, patch: Partial<Asset>) =>
    onChange(
      assets.map((a) => (a.id === id ? { ...a, ...patch } : a))
    );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Assets</h2>
        <button
          type="button"
          onClick={add}
          className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700"
        >
          + Add asset
        </button>
      </div>
      <p className="mb-4 text-sm text-slate-600">
        Optional: add real estate, vehicles, or other assets. Use depreciation for items that lose value (e.g. vehicle).
      </p>
      <div className="space-y-4">
        {assets.length === 0 && (
          <p className="text-sm text-slate-500">No assets added. Projection uses registered and non-registered accounts only.</p>
        )}
        {assets.map((a) => (
          <div
            key={a.id}
            className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4"
          >
            <label className="min-w-[120px] flex-1">
              <span className="text-xs text-slate-600">Name</span>
              <input
                value={a.name}
                onChange={(e) => update(a.id, { name: e.target.value })}
                className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="w-24">
              <span className="text-xs text-slate-600">Value ($)</span>
              <input
                type="number"
                min={0}
                step={1000}
                value={a.currentValue || ""}
                onChange={(e) => update(a.id, { currentValue: Number(e.target.value) || 0 })}
                className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="w-24">
              <span className="text-xs text-slate-600">Growth %</span>
              <input
                type="number"
                min={-20}
                step={0.5}
                value={a.annualGrowthRatePercent ?? 0}
                onChange={(e) => update(a.id, { annualGrowthRatePercent: Number(e.target.value) ?? 0 })}
                className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="w-24">
              <span className="text-xs text-slate-600">Depr. %</span>
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                placeholder="—"
                value={a.annualDepreciationPercent ?? ""}
                onChange={(e) =>
                  update(a.id, {
                    annualDepreciationPercent: e.target.value === "" ? undefined : Number(e.target.value),
                  })
                }
                className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              />
            </label>
            <select
              value={a.category}
              onChange={(e) => update(a.id, { category: e.target.value as AssetCategory })}
              className="rounded border border-slate-300 px-2 py-1.5 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
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
