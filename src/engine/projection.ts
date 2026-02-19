/**
 * Retirement projection engine (illustrative only; not financial advice).
 * Uses simplified Canadian tax and account rules.
 */

import type { PlanInputs, ProjectionYear, RegisteredAccount } from "../types";
import { getTotalTaxApprox } from "../data/canada";
import { CURRENT_YEAR } from "../data/canada";

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
  const assetBalances = new Map(assets.map((a) => [a.id, a.currentValue]));
  let totalDebt = liabilities.reduce((s, l) => s + l.balance, 0);

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
        otherTaxableIncome += fromNonReg * 0.5; // simplified: half as capital gains
        const stillNeeded = needed - fromNonReg;
        if (stillNeeded > 0 && rrsp > 0) {
          rrspWithdraw = Math.min(rrsp, stillNeeded);
          rrsp -= rrspWithdraw;
        }
      } else {
        rrspWithdraw = Math.min(rrsp, Math.max(0, needed));
        rrsp -= rrspWithdraw;
        const stillNeeded = needed - rrspWithdraw;
        if (stillNeeded > 0 && tfsa > 0) {
          tfsa -= Math.min(tfsa, stillNeeded);
        }
      }
    }

    const taxableIncome = Math.max(0, employmentIncome + rrspWithdraw + otherTaxableIncome - 0);
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
    const totalAssetsFromList = [...assetBalances.values()].reduce((s, v) => s + v, 0);
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

function sumByType(accounts: RegisteredAccount[], type: "RRSP" | "TFSA" | "FHSA"): number {
  return accounts.filter((a) => a.type === type).reduce((s, a) => s + a.currentBalance, 0);
}

function getAnnualContrib(accounts: RegisteredAccount[], type: "RRSP" | "TFSA" | "FHSA"): number {
  const a = accounts.find((x) => x.type === type);
  return a?.annualContribution ?? 0;
}
