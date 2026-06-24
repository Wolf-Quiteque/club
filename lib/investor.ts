export const BUS_PRICE = 125000000;
export const BUS_MONTHLY_NET_PROFIT = 5000000;
export const EXPECTED_ANNUAL_ROI = 0.21;
export const MIN_INVESTMENT = 1000000;
export const INVESTMENT_STEP = 1000000;
export const MIN_MONTHLY_NET_PROFIT = 1000000;
export const MAX_MONTHLY_NET_PROFIT = 10000000;
export const MONTHLY_NET_PROFIT_STEP = 250000;
export const RETURN_PERIOD_MONTHS = 12;

export const investmentTiers = [
  {
    code: "prata",
    name: "Prata",
    min: 1000000,
    max: 24999999,
    guarantee: 0.21,
    model: "Retorno mensal",
    benefit: "21% ao ano, pago mensalmente durante 12 meses.",
  },
  {
    code: "ouro",
    name: "Ouro",
    min: 25000000,
    max: 74999999,
    guarantee: 0.23,
    model: "Retorno mensal",
    benefit: "23% ao ano, pago mensalmente durante 12 meses.",
  },
  {
    code: "diamante",
    name: "Diamante",
    min: 75000000,
    max: BUS_PRICE,
    guarantee: 0.25,
    model: "Retorno mensal",
    benefit: "25% ao ano, pago mensalmente durante 12 meses.",
  },
] as const;

export type InvestmentTier = (typeof investmentTiers)[number];

export type InvestmentPlan = {
  amount: number;
  annualReturn: number;
  busRemaining: number;
  expectedAnnualRoi: number;
  minimumAnnualReturn: number;
  monthlyNetProfit: number;
  monthlyMinimumReturn: number;
  monthlyReturn: number;
  quota: number;
  tier: InvestmentTier;
};

export function clampInvestment(value: number) {
  if (!Number.isFinite(value)) {
    return MIN_INVESTMENT;
  }

  return Math.min(BUS_PRICE, Math.max(MIN_INVESTMENT, value));
}

export function clampMonthlyNetProfit(value: number) {
  if (!Number.isFinite(value)) {
    return BUS_MONTHLY_NET_PROFIT;
  }

  return Math.min(
    MAX_MONTHLY_NET_PROFIT,
    Math.max(MIN_MONTHLY_NET_PROFIT, value),
  );
}

export function normalizeInvestment(value: number) {
  const clamped = clampInvestment(value);
  return Math.min(
    BUS_PRICE,
    Math.max(MIN_INVESTMENT, Math.round(clamped / INVESTMENT_STEP) * INVESTMENT_STEP),
  );
}

export function normalizeMonthlyNetProfit(value: number) {
  const clamped = clampMonthlyNetProfit(value);
  return Math.min(
    MAX_MONTHLY_NET_PROFIT,
    Math.max(
      MIN_MONTHLY_NET_PROFIT,
      Math.round(clamped / MONTHLY_NET_PROFIT_STEP) * MONTHLY_NET_PROFIT_STEP,
    ),
  );
}

export function getInvestmentTier(amount: number) {
  return (
    investmentTiers.find((tier) => amount >= tier.min && amount <= tier.max) ??
    investmentTiers[investmentTiers.length - 1]
  );
}

export function calculateInvestmentPlan(
  rawAmount: number,
  rawMonthlyNetProfit = BUS_MONTHLY_NET_PROFIT,
): InvestmentPlan {
  const amount = normalizeInvestment(rawAmount);
  const monthlyNetProfit = normalizeMonthlyNetProfit(rawMonthlyNetProfit);
  const tier = getInvestmentTier(amount);
  const quota = amount / BUS_PRICE;
  const minimumAnnualReturn = amount * tier.guarantee;
  const annualReturn = amount + minimumAnnualReturn;
  const monthlyReturn = annualReturn / RETURN_PERIOD_MONTHS;

  return {
    amount,
    annualReturn,
    busRemaining: Math.max(0, BUS_PRICE - amount),
    expectedAnnualRoi: tier.guarantee,
    minimumAnnualReturn,
    monthlyNetProfit,
    monthlyMinimumReturn: minimumAnnualReturn / RETURN_PERIOD_MONTHS,
    monthlyReturn,
    quota,
    tier,
  };
}

export function formatKz(value: number) {
  return `${Math.round(value).toLocaleString("pt-PT")} Kz`;
}

export function formatPercent(value: number) {
  return `${value.toLocaleString("pt-PT", {
    maximumFractionDigits: value < 10 ? 1 : 0,
    minimumFractionDigits: value < 1 ? 1 : 0,
  })}%`;
}

export function getReferencePrefix(packageCode: string) {
  const prefixes: Record<string, string> = {
    prata: "INV-PRA",
    ouro: "INV-OUR",
    diamante: "INV-DIA",
  };

  if (prefixes[packageCode]) {
    return prefixes[packageCode];
  }

  return `INV-${packageCode.slice(0, 3).toUpperCase()}`;
}
