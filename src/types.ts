/** User profile and planning horizon */
export interface Profile {
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  province: Province;
}

/** Canadian province for tax/benefits (simplified federal + provincial) */
export type Province =
  | "AB" | "BC" | "MB" | "NB" | "NL" | "NS" | "NT" | "NU" | "ON" | "PE" | "QC" | "SK" | "YT";

/** Asset with optional depreciation */
export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  currentValue: number;
  annualGrowthRatePercent: number;
  /** For depreciating assets (e.g. vehicle): annual depreciation % */
  annualDepreciationPercent?: number;
  /** Useful life in years for amortization (e.g. property) */
  usefulLifeYears?: number;
}

export type AssetCategory =
  | "cash"
  | "investments"
  | "real_estate"
  | "vehicle"
  | "other";

/** Liability with optional amortization */
export interface Liability {
  id: string;
  name: string;
  balance: number;
  interestRatePercent: number;
  minimumMonthlyPayment: number;
  /** Amortization period in years */
  amortizationYears?: number;
}

/** Registered (RRSP, TFSA, FHSA) and non-registered account balances and flows */
export interface RegisteredAccount {
  type: "RRSP" | "TFSA" | "FHSA";
  currentBalance: number;
  /** Annual contribution (positive) or withdrawal (negative) */
  annualContribution: number;
  /** Growth rate assumption */
  growthRatePercent: number;
  /** For RRSP: earned income used for limit (18% of prior year) */
  earnedIncomeForLimit?: number;
}

export interface NonRegisteredAccount {
  id: string;
  name: string;
  currentBalance: number;
  /** Approx. annual taxable yield (dividends, interest) for tax estimate */
  taxableYieldPercent: number;
  growthRatePercent: number;
  /** Capital gains already accrued (for future tax estimate) */
  costBasis?: number;
}

/** Income and expenses */
export interface IncomeExpense {
  annualEmploymentIncome: number;
  annualOtherIncome: number;
  annualEssentialExpenses: number;
  annualDiscretionaryExpenses: number;
  /** Expected annual expense change in retirement (e.g. 0.8 = 80% of pre-retirement) */
  retirementExpenseRatio: number;
}

/** Assumptions for projections */
export interface Assumptions {
  inflationRatePercent: number;
  /** Real return assumption (nominal - inflation) for growth assets */
  realReturnPercent: number;
  /** Withdrawal strategy: which account to draw first in retirement */
  withdrawalOrder: "RRSP_first" | "TFSA_first" | "NonReg_first";
}

/** Single year in a projection */
export interface ProjectionYear {
  age: number;
  year: number;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  rrspBalance: number;
  tfsaBalance: number;
  fhsaBalance: number;
  nonRegisteredBalance: number;
  estimatedTax: number;
  expenses: number;
  income: number;
  isRetired: boolean;
}

/** Full plan state (all inputs) */
export interface PlanInputs {
  profile: Profile;
  assets: Asset[];
  liabilities: Liability[];
  registered: RegisteredAccount[];
  nonRegistered: NonRegisteredAccount[];
  incomeExpense: IncomeExpense;
  assumptions: Assumptions;
}
