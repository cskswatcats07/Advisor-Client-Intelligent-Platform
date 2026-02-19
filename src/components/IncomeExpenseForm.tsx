import type { IncomeExpense } from "../types";

interface Props {
  value: IncomeExpense;
  onChange: (v: IncomeExpense) => void;
}

export function IncomeExpenseForm({ value, onChange }: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-800">Income & expenses</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block">
          <span className="text-sm text-slate-600">Employment income ($/year)</span>
          <input
            type="number"
            min={0}
            step={1000}
            value={value.annualEmploymentIncome || ""}
            onChange={(e) =>
              onChange({ ...value, annualEmploymentIncome: Number(e.target.value) || 0 })
            }
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm text-slate-600">Other income ($/year)</span>
          <input
            type="number"
            min={0}
            step={1000}
            value={value.annualOtherIncome || ""}
            onChange={(e) =>
              onChange({ ...value, annualOtherIncome: Number(e.target.value) || 0 })
            }
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm text-slate-600">Essential expenses ($/year)</span>
          <input
            type="number"
            min={0}
            step={1000}
            value={value.annualEssentialExpenses || ""}
            onChange={(e) =>
              onChange({ ...value, annualEssentialExpenses: Number(e.target.value) || 0 })
            }
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm text-slate-600">Discretionary expenses ($/year)</span>
          <input
            type="number"
            min={0}
            step={1000}
            value={value.annualDiscretionaryExpenses || ""}
            onChange={(e) =>
              onChange({ ...value, annualDiscretionaryExpenses: Number(e.target.value) || 0 })
            }
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm text-slate-600">
            Retirement expense ratio (e.g. 0.8 = 80% of pre-retirement)
          </span>
          <input
            type="number"
            min={0.5}
            max={1.5}
            step={0.05}
            value={value.retirementExpenseRatio}
            onChange={(e) =>
              onChange({ ...value, retirementExpenseRatio: Number(e.target.value) || 0.8 })
            }
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
      </div>
    </section>
  );
}
