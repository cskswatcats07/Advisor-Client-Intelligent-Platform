import type { PlanInputs, Profile, IncomeExpense, Assumptions, RegisteredAccount } from "../types";

export const defaultProfile: Profile = {
  currentAge: 40,
  retirementAge: 65,
  lifeExpectancy: 90,
  province: "ON",
};

export const defaultIncomeExpense: IncomeExpense = {
  annualEmploymentIncome: 80_000,
  annualOtherIncome: 0,
  annualEssentialExpenses: 36_000,
  annualDiscretionaryExpenses: 18_000,
  retirementExpenseRatio: 0.8,
};

export const defaultAssumptions: Assumptions = {
  inflationRatePercent: 2.5,
  realReturnPercent: 4,
  withdrawalOrder: "RRSP_first",
};

export const defaultRegistered: RegisteredAccount[] = [
  { type: "RRSP", currentBalance: 150_000, annualContribution: 10_000, growthRatePercent: 5 },
  { type: "TFSA", currentBalance: 50_000, annualContribution: 7_000, growthRatePercent: 5 },
  { type: "FHSA", currentBalance: 0, annualContribution: 0, growthRatePercent: 5 },
];

export const defaultPlanInputs: PlanInputs = {
  profile: defaultProfile,
  assets: [],
  liabilities: [],
  registered: defaultRegistered,
  nonRegistered: [],
  incomeExpense: defaultIncomeExpense,
  assumptions: defaultAssumptions,
};
