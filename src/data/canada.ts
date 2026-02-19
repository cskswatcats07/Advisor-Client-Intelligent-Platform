/**
 * Canadian tax and account limits (illustrative; not advice).
 * Sources: CRA, Finance Canada. User should verify with current CRA figures.
 */

export const CURRENT_YEAR = 2025;

/** Federal tax brackets (2025) - upper bound of each band, rate applies to that band */
export const FEDERAL_BRACKETS_2025: { threshold: number; rate: number }[] = [
  { threshold: 57_375, rate: 0.15 },
  { threshold: 114_750, rate: 0.205 },
  { threshold: 177_882, rate: 0.26 },
  { threshold: 253_414, rate: 0.29 },
  { threshold: Number.MAX_SAFE_INTEGER, rate: 0.33 },
];

/** Basic personal amount (2025) */
export const BASIC_PERSONAL_AMOUNT_2025 = 16_129;

/** RRSP: max contribution is min(18% of prior year earned income, dollar limit) */
export const RRSP_DOLLAR_LIMIT_2025 = 32_490;

/** TFSA annual limit (2025) */
export const TFSA_ANNUAL_LIMIT_2025 = 7_000;

/** FHSA annual limit (2025) */
export const FHSA_ANNUAL_LIMIT_2025 = 8_000;

/** CPP max (approximate 2025) - for display only */
export const CPP_MAX_ANNUAL_2025 = 15_750;

/** OAS max (approximate 2025) - for display only */
export const OAS_MAX_ANNUAL_2025 = 9_156;

/** Provincial tax as % of federal (simplified; actual is separate brackets) */
export const PROVINCIAL_RATE_APPROX: Record<string, number> = {
  ON: 0.56,
  QC: 0.92,
  BC: 0.53,
  AB: 0.43,
  SK: 0.48,
  MB: 0.56,
  NS: 0.58,
  NB: 0.56,
  NL: 0.57,
  PE: 0.50,
  NT: 0.43,
  NU: 0.43,
  YT: 0.50,
};

export function getFederalTax(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0;
  const brackets = FEDERAL_BRACKETS_2025;
  let tax = 0;
  let prev = 0;
  for (const b of brackets) {
    const slice = Math.max(0, Math.min(taxableIncome, b.threshold) - prev);
    tax += slice * b.rate;
    prev = b.threshold;
  }
  return tax;
}

export function getProvincialTaxApprox(taxableIncome: number, province: string): number {
  const federal = getFederalTax(taxableIncome);
  const ratio = PROVINCIAL_RATE_APPROX[province] ?? 0.5;
  return federal * ratio;
}

export function getTotalTaxApprox(taxableIncome: number, province: string): number {
  return getFederalTax(taxableIncome) + getProvincialTaxApprox(taxableIncome, province);
}

/** RRSP deduction limit for a given earned income (prior year) */
export function rrspLimit(earnedIncome: number): number {
  return Math.min(earnedIncome * 0.18, RRSP_DOLLAR_LIMIT_2025);
}
