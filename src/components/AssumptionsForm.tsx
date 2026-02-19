import type { Assumptions } from "../types";

interface Props {
  value: Assumptions;
  onChange: (a: Assumptions) => void;
}

export function AssumptionsForm({ value, onChange }: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-800">Assumptions</h2>
      <p className="mb-4 text-sm text-slate-600">
        Inflation and return assumptions affect projections. Withdrawal order is illustrative only; a professional can help optimize.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block">
          <span className="text-sm text-slate-600">Inflation (%/year)</span>
          <input
            type="number"
            min={0}
            max={20}
            step={0.25}
            value={value.inflationRatePercent}
            onChange={(e) =>
              onChange({ ...value, inflationRatePercent: Number(e.target.value) || 0 })
            }
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm text-slate-600">Real return (%/year)</span>
          <input
            type="number"
            min={-5}
            max={15}
            step={0.25}
            value={value.realReturnPercent}
            onChange={(e) =>
              onChange({ ...value, realReturnPercent: Number(e.target.value) || 0 })
            }
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm text-slate-600">Retirement withdrawal order (illustrative)</span>
          <select
            value={value.withdrawalOrder}
            onChange={(e) =>
              onChange({
                ...value,
                withdrawalOrder: e.target.value as Assumptions["withdrawalOrder"],
              })
            }
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="RRSP_first">RRSP/RRIF first</option>
            <option value="TFSA_first">TFSA first</option>
            <option value="NonReg_first">Non-registered first</option>
          </select>
        </label>
      </div>
    </section>
  );
}
