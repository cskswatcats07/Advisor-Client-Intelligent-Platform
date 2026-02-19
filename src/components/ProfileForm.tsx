import type { Profile } from "../types";
import type { Province } from "../types";

const PROVINCES: Province[] = [
  "ON", "QC", "BC", "AB", "SK", "MB", "NS", "NB", "NL", "PE", "NT", "NU", "YT",
];

interface Props {
  value: Profile;
  onChange: (p: Profile) => void;
}

export function ProfileForm({ value, onChange }: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-800">Profile & horizon</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block">
          <span className="text-sm text-slate-600">Current age</span>
          <input
            type="number"
            min={18}
            max={100}
            value={value.currentAge}
            onChange={(e) => onChange({ ...value, currentAge: Number(e.target.value) || 0 })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm text-slate-600">Retirement age</span>
          <input
            type="number"
            min={value.currentAge}
            max={100}
            value={value.retirementAge}
            onChange={(e) => onChange({ ...value, retirementAge: Number(e.target.value) || 0 })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm text-slate-600">Planning to age</span>
          <input
            type="number"
            min={value.retirementAge}
            max={120}
            value={value.lifeExpectancy}
            onChange={(e) => onChange({ ...value, lifeExpectancy: Number(e.target.value) || 0 })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm text-slate-600">Province</span>
          <select
            value={value.province}
            onChange={(e) => onChange({ ...value, province: e.target.value as Province })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            {PROVINCES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
