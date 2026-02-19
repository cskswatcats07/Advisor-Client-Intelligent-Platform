import type {
  BankCatalogEntry,
  BankProduct,
  BankProductCategory,
} from "../../domain/types";

/**
 * Curated Canadian bank catalog with mainstream consumer product families.
 * Source baseline: publicly listed product sections on institution websites.
 * Catalog is intentionally configurable and can be overridden via DB patching.
 */
export const CANADIAN_BANK_CATALOG: BankCatalogEntry[] = [
  {
    bankCode: "RBC",
    bankName: "Royal Bank of Canada",
    institutionType: "brick_mortar",
    website: "https://www.rbc.com/",
    products: commonProducts(["accounts", "credit_cards", "mortgages", "lending", "insurance", "wealth", "business"]),
  },
  {
    bankCode: "TD",
    bankName: "TD Canada Trust",
    institutionType: "brick_mortar",
    website: "https://www.td.com/ca/en/personal-banking",
    products: commonProducts(["accounts", "credit_cards", "mortgages", "lending", "insurance", "wealth", "business"]),
  },
  {
    bankCode: "BNS",
    bankName: "Scotiabank",
    institutionType: "brick_mortar",
    website: "https://www.scotiabank.com/ca/en/personal.html",
    products: commonProducts(["accounts", "credit_cards", "mortgages", "lending", "insurance", "wealth", "business"]),
  },
  {
    bankCode: "BMO",
    bankName: "Bank of Montreal",
    institutionType: "brick_mortar",
    website: "https://www.bmo.com/",
    products: commonProducts(["accounts", "credit_cards", "mortgages", "lending", "insurance", "wealth", "business"]),
  },
  {
    bankCode: "CIBC",
    bankName: "CIBC",
    institutionType: "brick_mortar",
    website: "https://www.cibc.com/",
    products: commonProducts(["accounts", "credit_cards", "mortgages", "lending", "insurance", "wealth", "business"]),
  },
  {
    bankCode: "NBC",
    bankName: "National Bank of Canada",
    institutionType: "brick_mortar",
    website: "https://www.nbc.ca/",
    products: commonProducts(["accounts", "credit_cards", "mortgages", "lending", "insurance", "wealth", "business"]),
  },
  {
    bankCode: "DESJ",
    bankName: "Desjardins",
    institutionType: "credit_union",
    website: "https://www.desjardins.com/",
    products: commonProducts(["accounts", "credit_cards", "mortgages", "lending", "insurance", "wealth", "business"]),
  },
  {
    bankCode: "LAUR",
    bankName: "Laurentian Bank",
    institutionType: "brick_mortar",
    website: "https://www.laurentianbank.ca/",
    products: commonProducts(["accounts", "credit_cards", "mortgages", "lending", "wealth", "business"]),
  },
  {
    bankCode: "EQ",
    bankName: "EQ Bank",
    institutionType: "digital",
    website: "https://www.eqbank.ca/",
    products: commonProducts(["accounts", "lending", "mortgages"]),
  },
  {
    bankCode: "TANG",
    bankName: "Tangerine",
    institutionType: "digital",
    website: "https://www.tangerine.ca/",
    products: commonProducts(["accounts", "credit_cards", "mortgages", "lending", "insurance", "wealth"]),
  },
  {
    bankCode: "SIMPLII",
    bankName: "Simplii Financial",
    institutionType: "digital",
    website: "https://www.simplii.com/",
    products: commonProducts(["accounts", "credit_cards", "mortgages", "lending"]),
  },
  {
    bankCode: "KOHO",
    bankName: "KOHO",
    institutionType: "neobank",
    website: "https://www.koho.ca/",
    products: commonProducts(["accounts", "credit_cards", "lending"]),
  },
  {
    bankCode: "WS",
    bankName: "Wealthsimple",
    institutionType: "neobank",
    website: "https://www.wealthsimple.com/",
    products: commonProducts(["accounts", "wealth"]),
  },
  {
    bankCode: "NEO",
    bankName: "Neo Financial",
    institutionType: "neobank",
    website: "https://www.neofinancial.com/",
    products: commonProducts(["accounts", "credit_cards", "lending", "mortgages"]),
  },
  {
    bankCode: "PCF",
    bankName: "PC Financial",
    institutionType: "digital",
    website: "https://www.pcfinancial.ca/",
    products: commonProducts(["accounts", "credit_cards"]),
  },
  {
    bankCode: "MOTUS",
    bankName: "motusbank",
    institutionType: "digital",
    website: "https://www.motusbank.ca/",
    products: commonProducts(["accounts", "mortgages", "lending"]),
  },
];

function commonProducts(categories: BankProductCategory[]): BankProduct[] {
  const catalog: Record<BankProductCategory, BankProduct[]> = {
    accounts: [
      { productCode: "CHEQUING", name: "Chequing Account", category: "accounts" as const },
      { productCode: "SAVINGS", name: "Savings Account", category: "accounts" as const },
      { productCode: "GIC", name: "GIC / Term Deposit", category: "accounts" as const },
      { productCode: "USD_ACCT", name: "USD Account", category: "accounts" as const },
    ],
    credit_cards: [
      { productCode: "CC_CASHBACK", name: "Cash Back Credit Card", category: "credit_cards" as const },
      { productCode: "CC_TRAVEL", name: "Travel Rewards Credit Card", category: "credit_cards" as const },
      { productCode: "CC_LOW_RATE", name: "Low Rate Credit Card", category: "credit_cards" as const },
    ],
    mortgages: [
      { productCode: "MORT_FIXED", name: "Fixed Mortgage", category: "mortgages" as const },
      { productCode: "MORT_VARIABLE", name: "Variable Mortgage", category: "mortgages" as const },
      { productCode: "MORT_HELOC", name: "HELOC", category: "mortgages" as const },
    ],
    lending: [
      { productCode: "PL", name: "Personal Loan", category: "lending" as const },
      { productCode: "LOC", name: "Line of Credit", category: "lending" as const },
      { productCode: "AUTO", name: "Auto Financing", category: "lending" as const },
      { productCode: "STUDENT", name: "Student Lending", category: "lending" as const },
    ],
    insurance: [
      { productCode: "LIFE_INS", name: "Life Insurance", category: "insurance" as const },
      { productCode: "DISABILITY_INS", name: "Disability Insurance", category: "insurance" as const },
      { productCode: "HOME_AUTO_INS", name: "Home/Auto Insurance", category: "insurance" as const },
      { productCode: "TRAVEL_INS", name: "Travel Insurance", category: "insurance" as const },
    ],
    wealth: [
      { productCode: "DIRECT_INV", name: "Direct Investing", category: "wealth" as const },
      { productCode: "MF", name: "Mutual Funds", category: "wealth" as const },
      { productCode: "MANAGED", name: "Managed Portfolio", category: "wealth" as const },
      { productCode: "RET_ADVICE", name: "Retirement Advisory", category: "wealth" as const },
    ],
    business: [
      { productCode: "BUS_ACCT", name: "Business Account", category: "business" as const },
      { productCode: "MERCHANT", name: "Merchant Services", category: "business" as const },
      { productCode: "BUS_LOAN", name: "Business Lending", category: "business" as const },
      { productCode: "PAYROLL", name: "Payroll / Payables", category: "business" as const },
    ],
  };
  return categories.flatMap((c) => catalog[c] ?? []);
}
