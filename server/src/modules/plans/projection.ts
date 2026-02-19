import type { PlanInputs, ProjectionYear, RegisteredAccount } from "../../domain/types";

const CURRENT_YEAR = 2025;
const FEDERAL_BRACKETS_2025: { threshold: number; rate: number }[] = [
  { threshold: 57_375, rate: 0.15 },
  { threshold: 114_750, rate: 0.205 },
  { threshold: 177_882, rate: 0.26 },
  { threshold: 253_414, rate: 0.29 },
  { threshold: Number.MAX_SAFE_INTEGER, rate: 0.33 },
];

const PROVINCIAL_RATE_APPROX: Record<string, number> = {
  ON: 0.56,
  QC: 0.92,
  BC: 0.53,
  AB: 0.43,
  SK: 0.48,
  MB: 0.56,
  NS: 0.58,
  NB: 0.56,
  NL: 0.57,
  PE: 0.5,
  NT: 0.43,
  NU: 0.43,
  YT: 0.5,
};

function getFederalTax(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0;
  let tax = 0;
  let prev = 0;
  for (const b of FEDERAL_BRACKETS_2025) {
    const slice = Math.max(0, Math.min(taxableIncome, b.threshold) - prev);
    tax += slice * b.rate;
    prev = b.threshold;
  }
  return tax;
}

function getTotalTaxApprox(taxableIncome: number, province: string): number {
  const federal = getFederalTax(taxableIncome);
  const provincial = federal * (PROVINCIAL_RATE_APPROX[province] ?? 0.5);
  return federal + provincial;
}

function sumByType(accounts: RegisteredAccount[], type: "RRSP" | "TFSA" | "FHSA"): number {
  return accounts.filter((a) => a.type === type).reduce((s, a) => s + a.currentBalance, 0);
}

function getAnnualContrib(accounts: RegisteredAccount[], type: "RRSP" | "TFSA" | "FHSA"): number {
  const a = accounts.find((x) => x.type === type);
  return a?.annualContribution ?? 0;
}

export function runProjection(inputs: PlanInputs): ProjectionYear[] {
  const { profile, assets, liabilities, registered, nonRegistered, incomeExpense, assumptions } = inputs;
  const startAge = profile.currentAge;
  const endAge = profile.lifeExpectancy;
  const retirementAge = profile.retirementAge;
  const inflation = assumptions.inflationRatePercent / 100;
  const realReturn = assumptions.realReturnPercent / 100;
  const nominalReturn = (1 + realReturn) * (1 + inflation) - 1;

  const years: ProjectionYear[] = [];
  let rrsp = sumByType(registered, "RRSP");
  let tfsa = sumByType(registered, "TFSA");
  let fhsa = sumByType(registered, "FHSA");
  let nonReg = nonRegistered.reduce((s, a) => s + a.currentBalance, 0);
  const assetBalances = new Map<string, number>(assets.map((a) => [a.id, a.currentValue]));
  const totalDebt = liabilities.reduce((s, l) => s + l.balance, 0);

  const rrspContrib = getAnnualContrib(registered, "RRSP");
  const tfsaContrib = getAnnualContrib(registered, "TFSA");
  const fhsaContrib = getAnnualContrib(registered, "FHSA");

  for (let age = startAge, year = CURRENT_YEAR; age <= endAge; age++, year++) {
    const isRetired = age >= retirementAge;
    const preRetirementExpenses =
      incomeExpense.annualEssentialExpenses + incomeExpense.annualDiscretionaryExpenses;
    const expenseRatio = isRetired ? incomeExpense.retirementExpenseRatio : 1;
    const nominalExpenses = preRetirementExpenses * expenseRatio * Math.pow(1 + inflation, age - startAge);

    let employmentIncome = 0;
    let rrspWithdraw = 0;
    let otherTaxableIncome = 0;

    if (!isRetired) {
      employmentIncome = incomeExpense.annualEmploymentIncome + incomeExpense.annualOtherIncome;
      rrsp += rrspContrib;
      tfsa += tfsaContrib;
      fhsa += fhsaContrib;
    } else {
      const needed = nominalExpenses;
      if (assumptions.withdrawalOrder === "RRSP_first" && rrsp > 0) {
        rrspWithdraw = Math.min(rrsp, Math.max(0, needed));
        rrsp -= rrspWithdraw;
      } else if (assumptions.withdrawalOrder === "TFSA_first" && tfsa > 0) {
        const fromTfsa = Math.min(tfsa, Math.max(0, needed));
        tfsa -= fromTfsa;
        const stillNeeded = needed - fromTfsa;
        if (stillNeeded > 0 && rrsp > 0) {
          rrspWithdraw = Math.min(rrsp, stillNeeded);
          rrsp -= rrspWithdraw;
        }
      } else if (assumptions.withdrawalOrder === "NonReg_first" && nonReg > 0) {
        const fromNonReg = Math.min(nonReg, Math.max(0, needed));
        nonReg -= fromNonReg;
        otherTaxableIncome += fromNonReg * 0.5;
        const stillNeeded = needed - fromNonReg;
        if (stillNeeded > 0 && rrsp > 0) {
          rrspWithdraw = Math.min(rrsp, stillNeeded);
          rrsp -= rrspWithdraw;
        }
      } else {
        rrspWithdraw = Math.min(rrsp, Math.max(0, needed));
        rrsp -= rrspWithdraw;
      }
    }

    const taxableIncome = Math.max(0, employmentIncome + rrspWithdraw + otherTaxableIncome);
    const estimatedTax = taxableIncome > 0 ? getTotalTaxApprox(taxableIncome, profile.province) : 0;
    const income = employmentIncome + rrspWithdraw + otherTaxableIncome;

    rrsp *= 1 + nominalReturn;
    tfsa *= 1 + nominalReturn;
    fhsa *= 1 + nominalReturn;
    nonReg *= 1 + nominalReturn;

    for (const a of assets) {
      const v = assetBalances.get(a.id) ?? 0;
      const growth = 1 + (a.annualGrowthRatePercent ?? 0) / 100;
      const dep = a.annualDepreciationPercent ? 1 - a.annualDepreciationPercent / 100 : 1;
      assetBalances.set(a.id, v * growth * dep);
    }
    const totalAssetsFromList = [...assetBalances.values()].reduce<number>((s, v) => s + v, 0);
    const totalAssets = totalAssetsFromList + rrsp + tfsa + fhsa + nonReg;
    const totalLiabilities = totalDebt;
    const netWorth = totalAssets - totalLiabilities;

    years.push({
      age,
      year,
      totalAssets,
      totalLiabilities,
      netWorth,
      rrspBalance: rrsp,
      tfsaBalance: tfsa,
      fhsaBalance: fhsa,
      nonRegisteredBalance: nonReg,
      estimatedTax,
      expenses: nominalExpenses,
      income,
      isRetired,
    });
  }

  return years;
}
