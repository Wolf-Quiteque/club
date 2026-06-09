export const BUS_PRICE = 125000000;
export const BUS_MONTHLY_NET_PROFIT = 5000000;
export const EXPECTED_ANNUAL_ROI = 0.48;
export const MIN_INVESTMENT = 1000000;
export const INVESTMENT_STEP = 1000000;
export const MIN_MONTHLY_NET_PROFIT = 1000000;
export const MAX_MONTHLY_NET_PROFIT = 10000000;
export const MONTHLY_NET_PROFIT_STEP = 250000;

export const investmentTiers = [
  {
    code: "bronze",
    name: "Bronze",
    min: 1000000,
    max: 4999999,
    guarantee: 0.15,
    model: "Pool",
    benefit: "Extrato mensal simples",
  },
  {
    code: "prata",
    name: "Prata",
    min: 5000000,
    max: 9999999,
    guarantee: 0.2,
    model: "Pool",
    benefit: "Relatorio mensal de operacao",
  },
  {
    code: "ouro",
    name: "Ouro",
    min: 10000000,
    max: 19999999,
    guarantee: 0.25,
    model: "Pool avancado",
    benefit: "Branding inicial no autocarro",
  },
  {
    code: "platina",
    name: "Platina",
    min: 20000000,
    max: 99999999,
    guarantee: 0.3,
    model: "Solo dominante",
    benefit: "GPS, dashboard de receitas e prioridade",
  },
  {
    code: "diamante",
    name: "Diamante",
    min: 100000000,
    max: BUS_PRICE,
    guarantee: 0.4,
    model: "Proprietario",
    benefit: "Escritura em nome do investidor aos 125M Kz",
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
  const monthlyReturn = quota * monthlyNetProfit;
  const annualReturn = monthlyReturn * 12;
  const minimumAnnualReturn = amount * tier.guarantee;

  return {
    amount,
    annualReturn,
    busRemaining: Math.max(0, BUS_PRICE - amount),
    expectedAnnualRoi: (monthlyNetProfit * 12) / BUS_PRICE,
    minimumAnnualReturn,
    monthlyNetProfit,
    monthlyMinimumReturn: minimumAnnualReturn / 12,
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
  return `INV-${packageCode.slice(0, 3).toUpperCase()}`;
}
