"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  Banknote,
  BarChart3,
  Bell,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Copy,
  CreditCard,
  ExternalLink,
  FileCheck2,
  Gauge,
  LayoutDashboard,
  LineChart,
  Loader2,
  LockKeyhole,
  LogOut,
  Menu,
  PlusCircle,
  ReceiptText,
  ShieldCheck,
  Signal,
  SlidersHorizontal,
  TrendingUp,
  UserPlus,
  Wallet,
  X,
  Zap,
} from "lucide-react";

type AuthMode = "login" | "signup";
type DashboardTab = "overview" | "returns" | "contract" | "account";

const BUS_PRICE = 125000000;
const BUS_MONTHLY_NET_PROFIT = 5000000;
const EXPECTED_ANNUAL_ROI = 0.48;
const MIN_INVESTMENT = 1000000;
const INVESTMENT_STEP = 1000000;
const MIN_MONTHLY_NET_PROFIT = 1000000;
const MAX_MONTHLY_NET_PROFIT = 10000000;
const MONTHLY_NET_PROFIT_STEP = 250000;

const investmentTiers = [
  {
    name: "Bronze",
    min: 1000000,
    max: 4999999,
    guarantee: 0.15,
    model: "Pool",
    benefit: "Extrato mensal simples",
  },
  {
    name: "Prata",
    min: 5000000,
    max: 9999999,
    guarantee: 0.2,
    model: "Pool",
    benefit: "Relatorio mensal de operacao",
  },
  {
    name: "Ouro",
    min: 10000000,
    max: 19999999,
    guarantee: 0.25,
    model: "Pool avancado",
    benefit: "Branding inicial no autocarro",
  },
  {
    name: "Platina",
    min: 20000000,
    max: 99999999,
    guarantee: 0.3,
    model: "Solo dominante",
    benefit: "GPS, dashboard de receitas e prioridade",
  },
  {
    name: "Diamante",
    min: 100000000,
    max: BUS_PRICE,
    guarantee: 0.4,
    model: "Proprietario",
    benefit: "Escritura em nome do investidor aos 125M Kz",
  },
];

type InvestmentTier = (typeof investmentTiers)[number];
type InvestmentPlan = {
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

type InvestorAccount = {
  bank_name?: string | null;
  email: string;
  full_name: string;
  iban?: string | null;
  id: string;
  national_id?: string | null;
  phone?: string | null;
  status?: string;
};

type InvestorReference = {
  amount: number | string;
  created_at?: string;
  entity: string;
  expires_at?: string;
  id: string;
  reference: string;
  reference_url: string;
  status: string;
};

type InvestorInvestment = {
  amount: number | string;
  asset_code: string;
  created_at?: string;
  expected_annual_return: number | string;
  expected_monthly_return: number | string;
  id: string;
  minimum_annual_return: number | string;
  package_code: string;
  package_name: string;
  quota: number | string;
  reference?: InvestorReference | InvestorReference[] | null;
  route_label: string;
  status: string;
};

type InvestorSession = {
  accessToken: string;
  account: InvestorAccount;
  expiresAt?: number;
};

const monthlyReturns = [
  { month: "Jan", value: 83333, status: "Pago", pulse: 72 },
  { month: "Fev", value: 83333, status: "Pago", pulse: 78 },
  { month: "Mar", value: 83333, status: "Pago", pulse: 86 },
  { month: "Abr", value: 83333, status: "Pago", pulse: 80 },
  { month: "Mai", value: 83333, status: "Pago", pulse: 92 },
  { month: "Jun", value: 83333, status: "Agendado", pulse: 64 },
  { month: "Jul", value: 83333, status: "Agendado", pulse: 70 },
  { month: "Ago", value: 83333, status: "Agendado", pulse: 61 },
  { month: "Set", value: 83333, status: "Agendado", pulse: 76 },
  { month: "Out", value: 83333, status: "Agendado", pulse: 68 },
  { month: "Nov", value: 83333, status: "Agendado", pulse: 74 },
  { month: "Dez", value: 83333, status: "Agendado", pulse: 82 },
];

const investSteps = [
  {
    title: "Simular capital",
    detail: "Escolha a cota e veja o lucro proporcional.",
    icon: SlidersHorizontal,
  },
  {
    title: "Validar perfil",
    detail: "Dados fiscais, identidade e conta de recebimento.",
    icon: ShieldCheck,
  },
  {
    title: "Assinar contrato",
    detail: "Contrato com matricula, rota e autocarro identificado.",
    icon: FileCheck2,
  },
  {
    title: "Acompanhar ganhos",
    detail: "Pagamentos, relatorios e alertas no portal.",
    icon: ReceiptText,
  },
];

const investorActivity = [
  {
    title: "Pagamento de Maio liquidado",
    detail: "Parte proporcional do lucro enviada para BAI final 4421.",
    time: "09:40",
    tone: "green",
  },
  {
    title: "Relatorio operacional anexado",
    detail: "Passageiros, quilometros, receita, custos e margem.",
    time: "Ontem",
    tone: "blue",
  },
  {
    title: "Contrato validado",
    detail: "Compliance aprovou a adesao ao ciclo 2026.",
    time: "28 Mai",
    tone: "orange",
  },
];

const fleetSignals = [
  { label: "Frota gerida", value: "34", detail: "4 proprios + 30 externos" },
  { label: "Receita 2025", value: "367M", detail: "Kz auditados" },
  { label: "Lucro liquido", value: "116M", detail: "Kz verificados" },
];

const dashboardNavItems: {
  key: DashboardTab;
  label: string;
  icon: typeof Gauge;
}[] = [
  { key: "overview", label: "Visao geral", icon: Gauge },
  { key: "returns", label: "Retornos", icon: BarChart3 },
  { key: "contract", label: "Contrato", icon: FileCheck2 },
  { key: "account", label: "Conta", icon: CreditCard },
];

const heroWashStyle = {
  background:
    "linear-gradient(115deg, rgba(2, 6, 23, 0.96) 0%, rgba(15, 23, 42, 0.82) 44%, rgba(234, 88, 12, 0.58) 100%)",
};

const heroSignalStyle = {
  background:
    "radial-gradient(circle at 70% 35%, rgba(103, 232, 249, 0.16), transparent 34%)",
};

const interfaceGridStyle = {
  backgroundImage:
    "linear-gradient(rgba(255, 255, 255, 0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.055) 1px, transparent 1px)",
  backgroundSize: "56px 56px",
};

const formatKz = (value: number) =>
  `${Math.round(value).toLocaleString("pt-PT")} Kz`;

const formatPercent = (value: number) =>
  `${value.toLocaleString("pt-PT", {
    maximumFractionDigits: value < 10 ? 1 : 0,
    minimumFractionDigits: value < 1 ? 1 : 0,
  })}%`;

function getInvestmentReference(investment?: InvestorInvestment | null) {
  if (!investment?.reference) {
    return null;
  }

  return Array.isArray(investment.reference)
    ? investment.reference[0] ?? null
    : investment.reference;
}

function statusText(status?: string) {
  const labels: Record<string, string> = {
    active: "Ativo",
    cancelled: "Cancelado",
    completed: "Pago",
    expired: "Expirado",
    pending: "Pendente",
    pending_payment: "Aguardando pagamento",
    rejected: "Rejeitado",
    suspended: "Suspenso",
    under_review: "Em analise",
  };

  return labels[status || ""] || status || "Pendente";
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

async function copyText(value: string) {
  if (!value) {
    return;
  }

  if (navigator.clipboard) {
    await navigator.clipboard.writeText(value);
    return;
  }

  window.prompt("Copie a referencia:", value);
}

function clampInvestment(value: number) {
  if (!Number.isFinite(value)) {
    return MIN_INVESTMENT;
  }

  return Math.min(BUS_PRICE, Math.max(MIN_INVESTMENT, value));
}

function clampMonthlyNetProfit(value: number) {
  if (!Number.isFinite(value)) {
    return BUS_MONTHLY_NET_PROFIT;
  }

  return Math.min(
    MAX_MONTHLY_NET_PROFIT,
    Math.max(MIN_MONTHLY_NET_PROFIT, value),
  );
}

function normalizeInvestment(value: number) {
  const clamped = clampInvestment(value);
  return Math.min(
    BUS_PRICE,
    Math.max(MIN_INVESTMENT, Math.round(clamped / INVESTMENT_STEP) * INVESTMENT_STEP),
  );
}

function normalizeMonthlyNetProfit(value: number) {
  const clamped = clampMonthlyNetProfit(value);
  return Math.min(
    MAX_MONTHLY_NET_PROFIT,
    Math.max(
      MIN_MONTHLY_NET_PROFIT,
      Math.round(clamped / MONTHLY_NET_PROFIT_STEP) * MONTHLY_NET_PROFIT_STEP,
    ),
  );
}

function getInvestmentTier(amount: number) {
  return (
    investmentTiers.find((tier) => amount >= tier.min && amount <= tier.max) ??
    investmentTiers[investmentTiers.length - 1]
  );
}

function calculateInvestmentPlan(
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

function ActionButton({
  children,
  className = "",
  disabled = false,
  icon,
  onClick,
  tone = "primary",
  type = "button",
}: {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  icon: React.ReactNode;
  onClick?: () => void;
  tone?: "primary" | "secondary" | "ghost" | "dark";
  type?: "button" | "submit";
}) {
  const tones = {
    primary:
      "bg-orange-500 text-white shadow-lg shadow-orange-500/25 hover:bg-orange-400",
    secondary:
      "bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-300/20 hover:bg-cyan-200",
    ghost:
      "border border-white/25 bg-white/10 text-white backdrop-blur-xl hover:bg-white/15",
    dark:
      "bg-slate-950 text-white shadow-lg shadow-slate-950/20 hover:bg-slate-800",
  };

  return (
    <button
      className={`group inline-flex h-12 items-center justify-center gap-2 rounded-lg px-5 text-sm font-black transition duration-300 focus:outline-none focus:ring-4 focus:ring-cyan-300/30 ${tones[tone]} ${className}`}
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {icon}
      <span>{children}</span>
      <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
    </button>
  );
}

function Metric({
  icon,
  label,
  value,
  detail,
  dark = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`group rounded-lg border p-5 transition duration-300 hover:-translate-y-1 ${
        dark
          ? "border-white/10 bg-white/[0.06] text-white shadow-2xl shadow-slate-950/20"
          : "border-slate-200 bg-white text-slate-950 shadow-sm shadow-slate-950/5 hover:border-orange-200"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className={`text-xs font-black uppercase tracking-[0.16em] ${
              dark ? "text-cyan-100/70" : "text-slate-500"
            }`}
          >
            {label}
          </p>
          <p className="mt-3 text-2xl font-black tracking-tight">{value}</p>
        </div>
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
            dark
              ? "bg-cyan-300/12 text-cyan-200"
              : "bg-orange-50 text-orange-600"
          }`}
        >
          {icon}
        </span>
      </div>
      <p
        className={`mt-3 text-sm leading-6 ${
          dark ? "text-slate-300" : "text-slate-600"
        }`}
      >
        {detail}
      </p>
    </div>
  );
}

function StatusPill({
  children,
  tone = "orange",
}: {
  children: React.ReactNode;
  tone?: "orange" | "green" | "blue" | "slate";
}) {
  const tones = {
    orange: "bg-orange-500/12 text-orange-700 ring-orange-500/20",
    green: "bg-emerald-500/12 text-emerald-700 ring-emerald-500/20",
    blue: "bg-cyan-500/12 text-cyan-700 ring-cyan-500/20",
    slate: "bg-slate-900/8 text-slate-700 ring-slate-900/10",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-black ring-1 ${tones[tone]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

function ProductPreview() {
  const previewAmount = 25000000;
  const previewQuota = (previewAmount / BUS_PRICE) * 100;
  const previewMonthlyReturn =
    (previewAmount / BUS_PRICE) * BUS_MONTHLY_NET_PROFIT;

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 sm:px-6 lg:grid-cols-[1.35fr_0.9fr] lg:px-8">
      <div className="rounded-lg border border-white/18 bg-slate-950/78 p-4 text-white shadow-2xl shadow-slate-950/30 backdrop-blur-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
              Portal do investidor
            </p>
            <p className="mt-1 text-lg font-black">Clube Nawabus</p>
          </div>
          <StatusPill tone="blue">Demo ativo</StatusPill>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            ["Capital", formatKz(previewAmount)],
            ["Cota", formatPercent(previewQuota)],
            ["ROI esperado", `${formatPercent(EXPECTED_ANNUAL_ROI * 100)} ao ano`],
          ].map(([label, value]) => (
            <div
              className="rounded-lg border border-white/10 bg-white/[0.06] p-4"
              key={label}
            >
              <p className="text-xs font-bold text-slate-400">{label}</p>
              <p className="mt-2 text-xl font-black">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex h-32 items-end gap-2 rounded-lg border border-white/10 bg-slate-900/70 px-3 pb-3 pt-4">
          {monthlyReturns.map((item) => (
            <div
              className="group flex h-full flex-1 items-end"
              key={`preview-${item.month}`}
            >
              <div
                className={`w-full rounded-t-md transition duration-300 group-hover:opacity-80 ${
                  item.status === "Pago" ? "bg-orange-500" : "bg-cyan-300"
                }`}
                style={{ height: `${item.pulse}%` }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-white/18 bg-white/92 p-4 shadow-2xl shadow-slate-950/20 backdrop-blur-2xl">
        <div className="flex items-center justify-between">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            Motor financeiro
          </p>
          <Signal className="h-5 w-5 text-emerald-500" />
        </div>
        <div className="mt-4 rounded-lg bg-slate-950 p-4 text-white">
          <p className="text-sm text-slate-400">Lucro mensal esperado</p>
          <p className="mt-2 text-3xl font-black tracking-tight">
            {formatKz(previewMonthlyReturn)}
          </p>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-cyan-300"
              style={{ width: `${previewQuota}%` }}
            />
          </div>
          <p className="mt-3 text-xs font-bold text-cyan-100">
            {formatPercent(previewQuota)} do autocarro de {formatKz(BUS_PRICE)}
          </p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-xs font-bold text-slate-500">Risco demo</p>
            <p className="mt-1 text-sm font-black text-slate-950">
              Garantia 30%
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-xs font-bold text-slate-500">Proximo evento</p>
            <p className="mt-1 text-sm font-black text-slate-950">
              Dia 5 Jun
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TierLadder() {
  return (
    <section className="px-4 pb-18 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-orange-600">
              Niveis de investimento
            </p>
            <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
              A cota determina exatamente quanto lucro recebes.
            </h2>
          </div>
          <StatusPill tone="slate">
            Autocarro base: {formatKz(BUS_PRICE)}
          </StatusPill>
        </div>
        <div className="mt-8 grid gap-3 lg:grid-cols-5">
          {investmentTiers.map((tier) => {
            const expectedMonthly = (tier.min / BUS_PRICE) * BUS_MONTHLY_NET_PROFIT;
            const minQuota = (tier.min / BUS_PRICE) * 100;
            const range =
              tier.min === tier.max
                ? formatKz(tier.min)
                : `${formatKz(tier.min)} - ${formatKz(tier.max)}`;

            return (
              <div
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/5 transition hover:-translate-y-1 hover:border-cyan-200"
                key={tier.name}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                      Tier
                    </p>
                    <p className="mt-1 text-xl font-black text-slate-950">
                      {tier.name}
                    </p>
                  </div>
                  <span className="rounded-lg bg-orange-50 px-2 py-1 text-xs font-black text-orange-700">
                    {formatPercent(tier.guarantee * 100)}
                  </span>
                </div>
                <p className="mt-4 text-xs font-bold leading-5 text-slate-500">
                  {range}
                </p>
                <p className="mt-3 text-sm font-black text-slate-950">
                  Desde {formatPercent(minQuota)} do autocarro
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {formatKz(expectedMonthly)} esperado por mes. {tier.benefit}.
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PublicSimulationSection({
  onAuthOpen,
}: {
  onAuthOpen: (mode: AuthMode) => void;
}) {
  const [amount, setAmount] = useState(5000000);
  const [monthlyNetProfit, setMonthlyNetProfit] = useState(
    BUS_MONTHLY_NET_PROFIT,
  );
  const [amountDraft, setAmountDraft] = useState(String(amount));
  const [profitDraft, setProfitDraft] = useState(String(monthlyNetProfit));
  const plan = useMemo(
    () => calculateInvestmentPlan(amount, monthlyNetProfit),
    [amount, monthlyNetProfit],
  );

  const quickAmounts = [
    { label: "1M", value: 1000000 },
    { label: "5M", value: 5000000 },
    { label: "10M", value: 10000000 },
    { label: "20M", value: 20000000 },
    { label: "50M", value: 50000000 },
    { label: "125M", value: BUS_PRICE },
  ];
  const profitScenarios = [
    { label: "Conservador", value: 3500000 },
    { label: "Base", value: BUS_MONTHLY_NET_PROFIT },
    { label: "Forte", value: 6500000 },
  ];

  function commitAmount(value = amountDraft) {
    const nextAmount = normalizeInvestment(Number(value));
    setAmount(nextAmount);
    setAmountDraft(String(nextAmount));
  }

  function commitProfit(value = profitDraft) {
    const nextProfit = normalizeMonthlyNetProfit(Number(value));
    setMonthlyNetProfit(nextProfit);
    setProfitDraft(String(nextProfit));
  }

  function updateAmountDraft(value: string) {
    const digits = value.replace(/\D/g, "");
    setAmountDraft(digits);

    const nextAmount = Number(digits);
    if (nextAmount >= MIN_INVESTMENT && nextAmount <= BUS_PRICE) {
      setAmount(normalizeInvestment(nextAmount));
    }
  }

  function updateProfitDraft(value: string) {
    const digits = value.replace(/\D/g, "");
    setProfitDraft(digits);

    const nextProfit = Number(digits);
    if (
      nextProfit >= MIN_MONTHLY_NET_PROFIT &&
      nextProfit <= MAX_MONTHLY_NET_PROFIT
    ) {
      setMonthlyNetProfit(normalizeMonthlyNetProfit(nextProfit));
    }
  }

  return (
    <section className="px-4 pb-18 sm:px-6 lg:px-8" id="simulador">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-start">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-orange-600">
                Simulador publico
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Digite valores e veja a cota em tempo real.
              </h2>
            </div>
            <StatusPill tone="blue">Base: {formatKz(BUS_PRICE)}</StatusPill>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-bold text-slate-700">
              Capital a investir
              <div className="mt-2 flex gap-2">
                <input
                  className="h-12 min-w-0 flex-1 rounded-lg border border-slate-200 px-4 text-lg font-black text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-300/20"
                  inputMode="numeric"
                  onBlur={() => commitAmount()}
                  onChange={(event) => updateAmountDraft(event.target.value)}
                  onFocus={(event) => event.target.select()}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      commitAmount();
                    }
                  }}
                  type="text"
                  value={amountDraft}
                />
                <button
                  className="h-12 rounded-lg bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-slate-800"
                  onClick={() => commitAmount()}
                  type="button"
                >
                  OK
                </button>
              </div>
            </label>

            <label className="block text-sm font-bold text-slate-700">
              Lucro liquido mensal do autocarro
              <div className="mt-2 flex gap-2">
                <input
                  className="h-12 min-w-0 flex-1 rounded-lg border border-slate-200 px-4 text-lg font-black text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-300/20"
                  inputMode="numeric"
                  onBlur={() => commitProfit()}
                  onChange={(event) => updateProfitDraft(event.target.value)}
                  onFocus={(event) => event.target.select()}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      commitProfit();
                    }
                  }}
                  type="text"
                  value={profitDraft}
                />
                <button
                  className="h-12 rounded-lg bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-slate-800"
                  onClick={() => commitProfit()}
                  type="button"
                >
                  OK
                </button>
              </div>
            </label>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Capital rapido
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {quickAmounts.map((item) => (
                  <button
                    className={`rounded-lg border px-3 py-2 text-xs font-black transition ${
                      plan.amount === item.value
                        ? "border-slate-950 bg-slate-950 text-white"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-cyan-300"
                    }`}
                    key={item.label}
                    onClick={() => {
                      const nextAmount = normalizeInvestment(item.value);
                      setAmount(nextAmount);
                      setAmountDraft(String(nextAmount));
                    }}
                    type="button"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Cenario de lucro
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {profitScenarios.map((item) => (
                  <button
                    className={`rounded-lg border px-3 py-2 text-xs font-black transition ${
                      plan.monthlyNetProfit === item.value
                        ? "border-orange-500 bg-orange-500 text-white"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-orange-300"
                    }`}
                    key={item.label}
                    onClick={() => {
                      const nextProfit = normalizeMonthlyNetProfit(item.value);
                      setMonthlyNetProfit(nextProfit);
                      setProfitDraft(String(nextProfit));
                    }}
                    type="button"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <input
              aria-label="Capital a investir"
              className="h-2 w-full accent-orange-500"
              max={BUS_PRICE}
              min={MIN_INVESTMENT}
              onChange={(event) => {
                const nextAmount = normalizeInvestment(Number(event.target.value));
                setAmount(nextAmount);
                setAmountDraft(String(nextAmount));
              }}
              step={INVESTMENT_STEP}
              type="range"
              value={plan.amount}
            />
            <input
              aria-label="Lucro liquido mensal"
              className="h-2 w-full accent-cyan-500"
              max={MAX_MONTHLY_NET_PROFIT}
              min={MIN_MONTHLY_NET_PROFIT}
              onChange={(event) => {
                const nextProfit = normalizeMonthlyNetProfit(
                  Number(event.target.value),
                );
                setMonthlyNetProfit(nextProfit);
                setProfitDraft(String(nextProfit));
              }}
              step={MONTHLY_NET_PROFIT_STEP}
              type="range"
              value={plan.monthlyNetProfit}
            />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-950 p-5 text-white shadow-2xl shadow-slate-950/20 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
                Resultado da simulacao
              </p>
              <h3 className="mt-2 text-3xl font-black tracking-tight">
                Tier {plan.tier.name}
              </h3>
            </div>
            <StatusPill tone="blue">{plan.tier.model}</StatusPill>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              ["Cota no autocarro", formatPercent(plan.quota * 100)],
              ["Lucro mensal esperado", formatKz(plan.monthlyReturn)],
              ["Retorno anual esperado", formatKz(plan.annualReturn)],
              ["Garantia minima anual", formatKz(plan.minimumAnnualReturn)],
              ["Minimo mensal", formatKz(plan.monthlyMinimumReturn)],
              ["ROI do cenario", `${formatPercent(plan.expectedAnnualRoi * 100)} ao ano`],
            ].map(([label, value]) => (
              <div
                className="rounded-lg border border-white/10 bg-white/[0.06] p-4"
                key={label}
              >
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                  {label}
                </p>
                <p className="mt-2 text-xl font-black text-white">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-lg bg-white/8 p-4">
            <p className="text-sm leading-6 text-slate-300">
              Com {formatKz(plan.amount)}, o investidor financia{" "}
              {formatPercent(plan.quota * 100)} de um autocarro e recebe a
              mesma percentagem do lucro liquido mensal gerado pelo ativo.
            </p>
          </div>

          <ActionButton
            className="mt-5 w-full"
            icon={<UserPlus className="h-4 w-4" />}
            onClick={() => onAuthOpen("signup")}
            tone="secondary"
          >
            Abrir simulacao no portal
          </ActionButton>
        </div>
      </div>
    </section>
  );
}

function AuthPanel({
  mode,
  onModeChange,
  onComplete,
}: {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onComplete: (session: InvestorSession) => void;
}) {
  const isSignup = mode === "signup";
  const [form, setForm] = useState({
    bankName: "",
    email: "",
    fullName: "",
    iban: "",
    nationalId: "",
    password: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignup) {
        const accountResponse = await fetch("/api/investor/accounts", {
          body: JSON.stringify(form),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
        const accountResult = await accountResponse.json();

        if (!accountResponse.ok) {
          throw new Error(accountResult.error || "Nao foi possivel criar a conta.");
        }
      }

      const sessionResponse = await fetch("/api/investor/session", {
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const sessionResult = await sessionResponse.json();

      if (!sessionResponse.ok) {
        throw new Error(sessionResult.error || "Nao foi possivel iniciar sessao.");
      }

      onComplete(sessionResult);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Nao foi possivel concluir o acesso.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className="border-t border-slate-200 bg-slate-50 px-4 py-20 sm:px-6 lg:px-8"
      id="entrar"
    >
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_28rem] lg:items-start">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-orange-600">
            Acesso demo
          </p>
          <h2 className="mt-4 max-w-2xl text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
            Uma area privada para mostrar cotas, ativos e retornos.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
            O fluxo simula o que o investidor precisa ver: percentagem do
            autocarro, tier, garantia minima, lucro mensal, rota, matricula e
            relatorios de operacao.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {investSteps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/5 transition hover:-translate-y-1 hover:border-orange-200"
                  key={step.title}
                >
                  <Icon className="h-5 w-5 text-orange-600" />
                  <p className="mt-3 text-sm font-black text-slate-950">
                    {step.title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {step.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <form
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-950/10"
          onSubmit={submitAuth}
        >
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
            <button
              className={`rounded-md px-4 py-3 text-sm font-black transition ${
                !isSignup
                  ? "bg-slate-950 text-white shadow-sm"
                  : "text-slate-600 hover:bg-white"
              }`}
              onClick={() => onModeChange("login")}
              type="button"
            >
              Entrar
            </button>
            <button
              className={`rounded-md px-4 py-3 text-sm font-black transition ${
                isSignup
                  ? "bg-slate-950 text-white shadow-sm"
                  : "text-slate-600 hover:bg-white"
              }`}
              onClick={() => onModeChange("signup")}
              type="button"
            >
              Criar conta
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {isSignup ? (
              <label className="block text-sm font-bold text-slate-700">
                Nome completo
                <input
                  className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-300/20"
                  onChange={(event) => updateField("fullName", event.target.value)}
                  placeholder="Nome do investidor"
                  required
                  type="text"
                  value={form.fullName}
                />
              </label>
            ) : null}
            <label className="block text-sm font-bold text-slate-700">
              Email
              <input
                className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-300/20"
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="email@exemplo.com"
                required
                type="email"
                value={form.email}
              />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Palavra-passe
              <input
                className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-300/20"
                minLength={6}
                onChange={(event) => updateField("password", event.target.value)}
                placeholder="Minimo 6 caracteres"
                required
                type="password"
                value={form.password}
              />
            </label>
            {isSignup ? (
              <>
                <label className="block text-sm font-bold text-slate-700">
                  Telefone
                  <input
                    className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-300/20"
                    onChange={(event) => updateField("phone", event.target.value)}
                    placeholder="923000000"
                    type="tel"
                    value={form.phone}
                  />
                </label>
                <label className="block text-sm font-bold text-slate-700">
                  Documento fiscal
                  <input
                    className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-300/20"
                    onChange={(event) => updateField("nationalId", event.target.value)}
                    placeholder="BI ou NIF"
                    type="text"
                    value={form.nationalId}
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-[0.8fr_1.2fr]">
                  <label className="block text-sm font-bold text-slate-700">
                    Banco
                    <select
                      className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-300/20"
                      onChange={(event) => updateField("bankName", event.target.value)}
                      value={form.bankName}
                    >
                      <option value="">Selecionar banco</option>
                      <option value="BAI">BAI</option>
                      <option value="BFA">BFA</option>
                      <option value="Banco Atlantico">Banco Atlantico</option>
                      <option value="BIC">BIC</option>
                      <option value="Standard Bank">Standard Bank</option>
                    </select>
                  </label>
                  <label className="block text-sm font-bold text-slate-700">
                    IBAN
                    <input
                      className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-300/20"
                      onChange={(event) => updateField("iban", event.target.value)}
                      placeholder="AO06..."
                      type="text"
                      value={form.iban}
                    />
                  </label>
                </div>
              </>
            ) : null}
          </div>

          {error ? (
            <p className="mt-4 rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm font-bold text-orange-800">
              {error}
            </p>
          ) : null}

          <ActionButton
            className="mt-6 w-full"
            disabled={loading}
            icon={
              loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LayoutDashboard className="h-4 w-4" />
              )
            }
            tone="dark"
            type="submit"
          >
            {isSignup ? "Criar e abrir portal" : "Abrir portal"}
          </ActionButton>
          <p className="mt-4 text-center text-xs leading-5 text-slate-500">
            A conta fica ligada ao registo de investidor e ao historico de referencias.
          </p>
        </form>
      </div>
    </section>
  );
}

function Landing({
  onAuthOpen,
}: {
  onAuthOpen: (mode: AuthMode) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  function scrollToSimulator() {
    document.getElementById("simulador")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <main className="bg-slate-50 text-slate-950">
      <section className="relative min-h-[92svh] overflow-hidden bg-slate-950 text-white">
        <Image
          alt="Autocarro Nawabus em Angola"
          className="object-cover opacity-52"
          fill
          priority
          sizes="100vw"
          src="/bus22.webp"
        />
        <div className="absolute inset-0" style={heroWashStyle} />
        <div className="absolute inset-0" style={heroSignalStyle} />
        <div
          className="absolute inset-0 opacity-35"
          style={interfaceGridStyle}
        />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-slate-50 via-slate-50/90 to-transparent" />

        <div className="relative z-10 mx-auto flex min-h-[92svh] max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
          <header className="flex items-center justify-between gap-4 rounded-lg border border-white/14 bg-white/8 px-4 py-3 shadow-2xl shadow-slate-950/20 backdrop-blur-2xl">
            <Image
              alt="Nawabus"
              height={42}
              src="/nawabus_logo_white.webp"
              width={160}
            />
            <nav className="hidden items-center gap-1 text-sm font-bold text-white/78 md:flex">
              <a className="rounded-lg px-3 py-2 hover:bg-white/10" href="#modelo">
                Modelo
              </a>
              <a
                className="rounded-lg px-3 py-2 hover:bg-white/10"
                href="#simulador"
              >
                Simulador
              </a>
              <a className="rounded-lg px-3 py-2 hover:bg-white/10" href="#sinais">
                Sinais
              </a>
              <a className="rounded-lg px-3 py-2 hover:bg-white/10" href="#entrar">
                Portal
              </a>
            </nav>
            <div className="hidden items-center gap-2 sm:flex">
              <button
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/20 px-4 text-sm font-bold text-white transition hover:bg-white/10"
                onClick={() => onAuthOpen("login")}
                type="button"
              >
                <Wallet className="h-4 w-4" />
                Entrar
              </button>
              <button
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-cyan-300 px-4 text-sm font-black text-slate-950 transition hover:bg-cyan-200"
                onClick={() => onAuthOpen("signup")}
                type="button"
              >
                <UserPlus className="h-4 w-4" />
                Criar conta
              </button>
            </div>
            <button
              aria-label="Abrir menu"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 text-white sm:hidden"
              onClick={() => setMenuOpen((current) => !current)}
              type="button"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </header>

          {menuOpen ? (
            <div className="mt-3 grid gap-2 rounded-lg border border-white/14 bg-slate-950/90 p-3 text-sm font-black backdrop-blur-2xl sm:hidden">
              <button
                className="rounded-lg bg-white/10 px-4 py-3 text-left"
                onClick={() => onAuthOpen("login")}
                type="button"
              >
                Entrar
              </button>
              <button
                className="rounded-lg bg-cyan-300 px-4 py-3 text-left text-slate-950"
                onClick={() => onAuthOpen("signup")}
                type="button"
              >
                Criar conta
              </button>
            </div>
          ) : null}

          <div className="flex flex-1 flex-col justify-center pb-28 pt-12">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-lg border border-cyan-200/25 bg-cyan-200/10 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-100 backdrop-blur-xl">
                <Zap className="h-4 w-4" />
                Clube de Investidor Nawabus
              </div>
              <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[0.98] tracking-tight text-white sm:text-7xl lg:text-8xl">
                Compre uma cota da frota. Receba lucro real todo mes.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
                Cada investimento financia um autocarro identificado por
                matricula e rota. O retorno vem da tua percentagem no lucro
                liquido que esse ativo gera.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <ActionButton
                  icon={<ArrowRight className="h-4 w-4" />}
                  onClick={scrollToSimulator}
                  tone="secondary"
                >
                  Simular adesao
                </ActionButton>
                <ActionButton
                  icon={<LayoutDashboard className="h-4 w-4" />}
                  onClick={() => onAuthOpen("login")}
                  tone="ghost"
                >
                  Ver portal demo
                </ActionButton>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-20 -mt-32 pb-12">
          <ProductPreview />
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8" id="modelo">
        <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-3">
          <Metric
            detail="Calculado a partir de 5M Kz de lucro liquido mensal por autocarro."
            icon={<TrendingUp className="h-5 w-5" />}
            label="ROI esperado"
            value={`${formatPercent(EXPECTED_ANNUAL_ROI * 100)} ao ano`}
          />
          <Metric
            detail="Valor base para financiar um autocarro completo."
            icon={<CalendarClock className="h-5 w-5" />}
            label="Ativo"
            value="125M Kz"
          />
          <Metric
            detail="Bronze a Diamante, com garantias minimas de 15% a 40%."
            icon={<CircleDollarSign className="h-5 w-5" />}
            label="Entrada"
            value="1M Kz"
          />
        </div>
      </section>

      <PublicSimulationSection onAuthOpen={onAuthOpen} />

      <TierLadder />

      <section className="bg-slate-950 px-4 py-18 text-white sm:px-6 lg:px-8" id="sinais">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-200">
              Sinais operacionais
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
              Operacao real, painel demo com dados verificaveis.
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {fleetSignals.map((signal) => (
              <div
                className="rounded-lg border border-white/10 bg-white/[0.06] p-5"
                key={signal.label}
              >
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                  {signal.label}
                </p>
                <p className="mt-3 text-3xl font-black">{signal.value}</p>
                <p className="mt-2 text-sm text-cyan-100">{signal.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-orange-600">
                Jornada do investidor
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Menos friccao, mais confianca visual.
              </h2>
            </div>
          </div>
          <div className="mt-8 grid gap-3 lg:grid-cols-4">
            {investSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5 transition hover:-translate-y-1 hover:border-cyan-200"
                  key={step.title}
                >
                  <div className="flex items-center justify-between">
                    <Icon className="h-6 w-6 text-orange-600" />
                    <span className="text-xs font-black text-slate-400">
                      0{index + 1}
                    </span>
                  </div>
                  <p className="mt-5 text-lg font-black text-slate-950">
                    {step.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {step.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}

function Dashboard({
  onLogout,
  session,
}: {
  onLogout: () => void;
  session: InvestorSession;
}) {
  const [amount, setAmount] = useState(5000000);
  const [account, setAccount] = useState(session.account);
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [investments, setInvestments] = useState<InvestorInvestment[]>([]);
  const [dashboardError, setDashboardError] = useState("");
  const [dataLoading, setDataLoading] = useState(true);
  const [creatingReference, setCreatingReference] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("Mai");

  const plan = useMemo(() => calculateInvestmentPlan(amount), [amount]);
  const latestInvestment = investments[0] ?? null;
  const latestReference = getInvestmentReference(latestInvestment);

  const progress = 42;
  const selectedReturn =
    monthlyReturns.find((item) => item.month === selectedMonth) ??
    monthlyReturns[4];

  async function refreshInvestments() {
    setDashboardError("");
    setDataLoading(true);

    try {
      const response = await fetch("/api/investor/investments", {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Nao foi possivel carregar o dashboard.");
      }

      setAccount(result.account || session.account);
      setInvestments(result.investments || []);
    } catch (error) {
      setDashboardError(
        error instanceof Error ? error.message : "Nao foi possivel carregar o dashboard.",
      );
    } finally {
      setDataLoading(false);
    }
  }

  async function createInvestmentReference() {
    setDashboardError("");
    setCreatingReference(true);

    try {
      const response = await fetch("/api/investor/investments", {
        body: JSON.stringify({ amount: plan.amount }),
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Nao foi possivel gerar a referencia.");
      }

      setAccount(result.account || account);
      setInvestments((current) => [result.investment, ...current]);
      setActiveTab("contract");
    } catch (error) {
      setDashboardError(
        error instanceof Error ? error.message : "Nao foi possivel gerar a referencia.",
      );
    } finally {
      setCreatingReference(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      refreshInvestments();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.accessToken]);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[18rem_1fr]">
        <aside className="hidden border-r border-white/10 bg-slate-950 px-4 py-5 text-white lg:sticky lg:top-0 lg:block lg:h-screen lg:overflow-y-auto">
          <Image
            alt="Nawabus"
            height={38}
            src="/nawabus_logo_white.webp"
            width={150}
          />
          <nav className="mt-8 grid gap-2 text-sm font-black text-slate-300">
            {dashboardNavItems.map(({ key, label, icon: NavIcon }) => {
              return (
                <button
                  className={`flex items-center gap-3 rounded-lg px-3 py-3 text-left transition ${
                    activeTab === key
                      ? "bg-cyan-300 text-slate-950"
                      : "hover:bg-white/8"
                  }`}
                  key={key}
                  onClick={() => setActiveTab(key)}
                  type="button"
                >
                  <NavIcon className="h-4 w-4" />
                  {label}
                </button>
              );
            })}
          </nav>
          <div className="mt-8 rounded-lg border border-white/10 bg-white/[0.06] p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Conta
              </p>
              <Activity className="h-4 w-4 text-emerald-300" />
            </div>
            <p className="mt-2 text-sm font-black">{account.full_name}</p>
            <p className="mt-1 truncate text-xs font-bold text-slate-400">
              {account.email}
            </p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/12">
              <div
                className="h-full rounded-full bg-cyan-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-xs font-bold text-slate-400">
              {investments.length} investimento(s)
            </p>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-slate-100/85 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">
                  Portal do investidor
                </p>
                <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                  Dashboard Nawabus
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden h-10 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 md:flex">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-950 text-xs text-white">
                    {getInitials(account.full_name)}
                  </span>
                  {account.full_name}
                </div>
                <button
                  aria-label="Notificacoes"
                  className="hidden h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:border-cyan-300 sm:inline-flex"
                  type="button"
                >
                  <Bell className="h-4 w-4" />
                </button>
                <button
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-orange-200 hover:bg-orange-50"
                  onClick={onLogout}
                  type="button"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </button>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:hidden">
              {dashboardNavItems.map(({ key, label, icon: NavIcon }) => {
                return (
                  <button
                    className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg text-xs font-black transition ${
                      activeTab === key
                        ? "bg-slate-950 text-white"
                        : "bg-white text-slate-600"
                      }`}
                    key={key}
                    onClick={() => setActiveTab(key)}
                    type="button"
                  >
                    <NavIcon className="h-4 w-4" />
                    {label}
                  </button>
                );
              })}
            </div>
          </header>

          <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
            {dashboardError ? (
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm font-bold text-orange-800">
                {dashboardError}
              </div>
            ) : null}

            {activeTab === "overview" ? (
              <>
                <section className="overflow-hidden rounded-lg border border-slate-200 bg-slate-950 text-white shadow-2xl shadow-slate-950/10">
                  <div className="relative p-5 sm:p-7">
                    <div
                      className="absolute inset-0 opacity-40"
                      style={interfaceGridStyle}
                    />
                    <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                      <div>
                        <p className="inline-flex items-center gap-2 rounded-lg bg-emerald-300/12 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100 ring-1 ring-emerald-300/20">
                          <CheckCircle2 className="h-4 w-4" />
                          Conta ligada a base de dados
                        </p>
                        <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">
                          Escolha o pacote e gere a referencia de investimento.
                        </h2>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                          O dashboard grava a conta, o investimento escolhido e
                          uma referencia com prefixo do pacote selecionado.
                        </p>
                      </div>
                      <ActionButton
                        disabled={creatingReference}
                        icon={
                          creatingReference ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Wallet className="h-4 w-4" />
                          )
                        }
                        onClick={createInvestmentReference}
                        tone="secondary"
                      >
                        Gerar referencia
                      </ActionButton>
                    </div>
                  </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <Metric
                    detail={`Tier ${plan.tier.name} no modelo ${plan.tier.model}.`}
                    icon={<Wallet className="h-5 w-5" />}
                    label="Capital investido"
                    value={formatKz(plan.amount)}
                  />
                  <Metric
                    detail="Parte proporcional de 5M Kz de lucro liquido mensal."
                    icon={<TrendingUp className="h-5 w-5" />}
                    label="Lucro mensal"
                    value={formatKz(plan.monthlyReturn)}
                  />
                  <Metric
                    detail="Percentagem do autocarro financiada pelo investidor."
                    icon={<CalendarClock className="h-5 w-5" />}
                    label="Cota do ativo"
                    value={formatPercent(plan.quota * 100)}
                  />
                  <Metric
                    detail={`${formatPercent(plan.tier.guarantee * 100)} ao ano por contrato.`}
                    icon={<CircleDollarSign className="h-5 w-5" />}
                    label="Garantia minima"
                    value={formatKz(plan.minimumAnnualReturn)}
                  />
                </section>

                <section className="grid gap-6 xl:grid-cols-[24rem_1fr]">
                  <Simulator plan={plan} setAmount={setAmount} />
                  <div className="grid gap-6">
                    <ReferenceCard
                      creating={creatingReference}
                      investment={latestInvestment}
                      onCopyReference={() =>
                        latestReference ? copyText(latestReference.reference) : undefined
                      }
                      onCopyUrl={() =>
                        latestReference ? copyText(latestReference.reference_url) : undefined
                      }
                      onCreate={createInvestmentReference}
                      plan={plan}
                    />
                    <ReturnsChart
                      monthlyReturn={plan.monthlyReturn}
                      selectedMonth={selectedMonth}
                      setSelectedMonth={setSelectedMonth}
                    />
                  </div>
                </section>
              </>
            ) : null}

            {activeTab === "returns" ? (
              <section className="grid gap-6 xl:grid-cols-[1fr_22rem]">
                <ReturnsChart
                  monthlyReturn={plan.monthlyReturn}
                  selectedMonth={selectedMonth}
                  setSelectedMonth={setSelectedMonth}
                />
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    Mes selecionado
                  </p>
                  <h2 className="mt-2 text-3xl font-black text-slate-950">
                    {selectedReturn.month}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Valor esperado de {formatKz(plan.monthlyReturn)} para uma
                    cota de {formatPercent(plan.quota * 100)} com estado{" "}
                    {selectedReturn.status.toLowerCase()}.
                  </p>
                  <div className="mt-5 grid gap-3">
                    <Metric
                      detail="Parte proporcional do lucro liquido do autocarro."
                      icon={<Banknote className="h-5 w-5" />}
                      label="Pagamento esperado"
                      value={formatKz(plan.monthlyReturn)}
                    />
                    <Metric
                      detail={`${formatPercent(plan.tier.guarantee * 100)} minimo anual para o Tier ${plan.tier.name}.`}
                      icon={<LineChart className="h-5 w-5" />}
                      label="Garantia anual"
                      value={formatKz(plan.minimumAnnualReturn)}
                    />
                  </div>
                </div>
              </section>
            ) : null}

            {activeTab === "contract" ? (
              <section className="grid gap-6 xl:grid-cols-[1fr_24rem]">
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                        Referencia ativa
                      </p>
                      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                        {latestReference?.reference || "Ainda sem referencia"}
                      </h2>
                    </div>
                    <StatusPill tone={latestReference ? "orange" : "slate"}>
                      {statusText(latestReference?.status)}
                    </StatusPill>
                  </div>
                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <Metric
                      detail="Capital necessario para fechar o ativo."
                      icon={<Clock3 className="h-5 w-5" />}
                      label="Por financiar"
                      value={formatKz(
                        Math.max(0, BUS_PRICE - Number(latestInvestment?.amount || plan.amount)),
                      )}
                    />
                    <Metric
                      detail="Matricula e rota ficam ligados ao contrato."
                      icon={<LockKeyhole className="h-5 w-5" />}
                      label="Ativo"
                      value={latestInvestment?.asset_code || "NB-2026-014"}
                    />
                    <Metric
                      detail="Conta bancaria de recebimento mensal."
                      icon={<CreditCard className="h-5 w-5" />}
                      label="Pagamento"
                      value={account.bank_name || "Conta pendente"}
                    />
                  </div>
                  {latestReference ? (
                    <div className="mt-6 rounded-lg border border-orange-200 bg-orange-50 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-700">
                            Dados para pagamento
                          </p>
                          <p className="mt-2 text-sm font-bold text-slate-700">
                            Entidade {latestReference.entity} | Valor{" "}
                            {formatKz(Number(latestReference.amount))}
                          </p>
                        </div>
                        <button
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-black text-white"
                          onClick={() => copyText(latestReference.reference_url)}
                          type="button"
                        >
                          <Copy className="h-4 w-4" />
                          Copiar link
                        </button>
                      </div>
                    </div>
                  ) : null}
                  <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-[0.14em] text-slate-500">
                        <tr>
                          <th className="px-4 py-3">Marco</th>
                          <th className="px-4 py-3">Data</th>
                          <th className="px-4 py-3">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ["Conta criada", "Agora", statusText(account.status)],
                          [
                            "Pacote escolhido",
                            latestInvestment?.package_name || plan.tier.name,
                            latestInvestment ? "Gravado" : "Por gerar",
                          ],
                          [
                            "Referencia de pagamento",
                            latestReference?.reference || "-",
                            statusText(latestReference?.status),
                          ],
                          ["Contrato final", "Apos pagamento", "Em analise"],
                        ].map(([milestone, date, status]) => (
                          <tr className="border-t border-slate-200" key={milestone}>
                            <td className="px-4 py-3 font-black">{milestone}</td>
                            <td className="px-4 py-3 text-slate-600">{date}</td>
                            <td className="px-4 py-3">
                              <StatusPill
                                tone={status === "Pago" || status === "Concluido" || status === "Gravado" ? "green" : "orange"}
                              >
                                {status}
                              </StatusPill>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <ActivityFeed />
              </section>
            ) : null}

            {activeTab === "account" ? (
              <section className="grid gap-6 xl:grid-cols-[24rem_1fr]">
                <AccountPanel account={account} />
                <InvestmentsTable
                  dataLoading={dataLoading}
                  investments={investments}
                  onCopy={(value) => copyText(value)}
                />
              </section>
            ) : null}

            {activeTab === "overview" || activeTab === "returns" ? (
              <section className="grid gap-6 xl:grid-cols-2">
                <PaymentsTable monthlyReturn={plan.monthlyReturn} />
                <ActivityFeed />
              </section>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}

function ReferenceCard({
  creating,
  investment,
  onCopyReference,
  onCopyUrl,
  onCreate,
  plan,
}: {
  creating: boolean;
  investment: InvestorInvestment | null;
  onCopyReference: () => void;
  onCopyUrl: () => void;
  onCreate: () => void;
  plan: InvestmentPlan;
}) {
  const reference = getInvestmentReference(investment);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            Referencia de pagamento
          </p>
          <h2 className="mt-2 break-words text-2xl font-black text-slate-950">
            {reference?.reference || `INV-${plan.tier.name.slice(0, 3).toUpperCase()}-...`}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            O prefixo da referencia segue o pacote escolhido: {plan.tier.name}.
          </p>
        </div>
        <StatusPill tone={reference ? "orange" : "slate"}>
          {reference ? statusText(reference.status) : "Por gerar"}
        </StatusPill>
      </div>

      {reference ? (
        <div className="mt-5 grid gap-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric
              detail="Entidade usada nas referencias Nawabus."
              icon={<ReceiptText className="h-5 w-5" />}
              label="Entidade"
              value={reference.entity}
            />
            <Metric
              detail={`Pacote ${investment?.package_name || plan.tier.name}.`}
              icon={<Wallet className="h-5 w-5" />}
              label="Valor"
              value={formatKz(Number(reference.amount))}
            />
            <Metric
              detail="Link publico para validar esta referencia."
              icon={<ExternalLink className="h-5 w-5" />}
              label="Link"
              value="Ativo"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-cyan-300"
              onClick={onCopyReference}
              type="button"
            >
              <Copy className="h-4 w-4" />
              Copiar ref.
            </button>
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-cyan-300"
              onClick={onCopyUrl}
              type="button"
            >
              <Copy className="h-4 w-4" />
              Copiar link
            </button>
            <a
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-slate-800"
              href={reference.reference_url}
              rel="noopener noreferrer"
              target="_blank"
            >
              <ExternalLink className="h-4 w-4" />
              Abrir
            </a>
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm leading-6 text-slate-600">
            Gere uma referencia para gravar o pacote {plan.tier.name} com valor
            de {formatKz(plan.amount)} na base de dados.
          </p>
          <button
            className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-60"
            disabled={creating}
            onClick={onCreate}
            type="button"
          >
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PlusCircle className="h-4 w-4" />
            )}
            Gerar referencia
          </button>
        </div>
      )}
    </div>
  );
}

function AccountPanel({ account }: { account: InvestorAccount }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            Conta do investidor
          </p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">
            {account.full_name}
          </h2>
        </div>
        <StatusPill tone="green">{statusText(account.status)}</StatusPill>
      </div>
      <div className="mt-5 grid gap-3">
        {[
          ["Email", account.email],
          ["Telefone", account.phone || "-"],
          ["Documento", account.national_id || "-"],
          ["Banco", account.bank_name || "-"],
          ["IBAN", account.iban || "-"],
        ].map(([label, value]) => (
          <div
            className="rounded-lg border border-slate-200 bg-slate-50 p-3"
            key={label}
          >
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
              {label}
            </p>
            <p className="mt-1 break-words text-sm font-black text-slate-950">
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function InvestmentsTable({
  dataLoading,
  investments,
  onCopy,
}: {
  dataLoading: boolean;
  investments: InvestorInvestment[];
  onCopy: (value: string) => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            Historico
          </p>
          <h2 className="mt-2 text-xl font-black text-slate-950">
            Investimentos iniciados
          </h2>
        </div>
        {dataLoading ? <Loader2 className="h-5 w-5 animate-spin text-orange-600" /> : null}
      </div>
      <div className="mt-5 overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.14em] text-slate-500">
            <tr>
              <th className="px-4 py-3">Pacote</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Referencia</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acao</th>
            </tr>
          </thead>
          <tbody>
            {investments.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={5}>
                  Ainda nao existe investimento iniciado.
                </td>
              </tr>
            ) : (
              investments.map((investment) => {
                const reference = getInvestmentReference(investment);
                return (
                  <tr className="border-t border-slate-200" key={investment.id}>
                    <td className="px-4 py-3 font-black">{investment.package_name}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatKz(Number(investment.amount))}
                    </td>
                    <td className="px-4 py-3 font-black text-slate-950">
                      {reference?.reference || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill tone={reference?.status === "completed" ? "green" : "orange"}>
                        {statusText(reference?.status || investment.status)}
                      </StatusPill>
                    </td>
                    <td className="px-4 py-3">
                      {reference ? (
                        <button
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-black text-slate-700 transition hover:border-cyan-300"
                          onClick={() => onCopy(reference.reference_url)}
                          type="button"
                        >
                          <Copy className="h-4 w-4" />
                          Link
                        </button>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Simulator({
  plan,
  setAmount,
}: {
  plan: InvestmentPlan;
  setAmount: (amount: number) => void;
}) {
  const [draftAmount, setDraftAmount] = useState(String(plan.amount));
  const selectedPackage = plan.tier.name;
  const draftNumeric = Number(draftAmount);
  const draftIsValid =
    draftAmount.length > 0 &&
    Number.isFinite(draftNumeric) &&
    draftNumeric >= MIN_INVESTMENT &&
    draftNumeric <= BUS_PRICE;

  function commitAmount(value = draftAmount) {
    const nextAmount = normalizeInvestment(Number(value));
    setAmount(nextAmount);
    setDraftAmount(String(nextAmount));
  }

  function updateDraft(value: string) {
    const digits = value.replace(/\D/g, "");
    setDraftAmount(digits);

    const nextAmount = Number(digits);
    if (nextAmount >= MIN_INVESTMENT && nextAmount <= BUS_PRICE) {
      setAmount(normalizeInvestment(nextAmount));
    }
  }

  function selectPackage(tier: InvestmentTier) {
    const nextAmount = normalizeInvestment(tier.min);
    setAmount(nextAmount);
    setDraftAmount(String(nextAmount));
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            Escolha o pacote
          </p>
          <h2 className="mt-2 text-xl font-black text-slate-950">
            Selecione e invista
          </h2>
        </div>
        <SlidersHorizontal className="h-5 w-5 text-orange-600" />
      </div>

      <div className="mt-5 grid gap-2">
        {investmentTiers.map((tier) => {
          const isSelected = selectedPackage === tier.name;
          const range =
            tier.min === tier.max
              ? formatKz(tier.min)
              : `${formatKz(tier.min)} - ${formatKz(tier.max)}`;
          const monthlyReturn = (tier.min / BUS_PRICE) * BUS_MONTHLY_NET_PROFIT;

          return (
            <button
              className={`grid min-h-24 gap-3 rounded-lg border p-4 text-left transition sm:grid-cols-[1fr_auto] sm:items-center ${
                isSelected
                  ? "border-slate-950 bg-slate-950 text-white shadow-lg shadow-slate-950/15"
                  : "border-slate-200 bg-white text-slate-950 hover:border-cyan-300 hover:bg-slate-50"
              }`}
              key={tier.name}
              onClick={() => selectPackage(tier)}
              type="button"
            >
              <span>
                <span className="block text-base font-black">{tier.name}</span>
                <span
                  className={`mt-1 block text-xs font-bold leading-5 ${
                    isSelected ? "text-slate-300" : "text-slate-500"
                  }`}
                >
                  {range}
                </span>
                <span
                  className={`mt-2 block text-xs leading-5 ${
                    isSelected ? "text-cyan-100" : "text-slate-600"
                  }`}
                >
                  Desde {formatKz(monthlyReturn)} por mes esperado.
                </span>
              </span>
              <span
                className={`inline-flex h-8 items-center justify-center rounded-lg px-3 text-xs font-black ${
                  isSelected ? "bg-cyan-300 text-slate-950" : "bg-orange-50 text-orange-700"
                }`}
              >
                {formatPercent(tier.guarantee * 100)}
              </span>
            </button>
          );
        })}
      </div>

      <label className="mt-5 block text-sm font-bold text-slate-700">
        Valor exato do pacote
        <div className="mt-2 flex gap-2">
          <input
            className={`h-12 min-w-0 flex-1 rounded-lg border px-4 text-lg font-black outline-none transition focus:ring-4 ${
              draftIsValid
                ? "border-slate-200 focus:border-cyan-400 focus:ring-cyan-300/20"
                : "border-orange-300 focus:border-orange-400 focus:ring-orange-200/40"
            }`}
            inputMode="numeric"
            onBlur={() => commitAmount()}
            onChange={(event) => updateDraft(event.target.value)}
            onFocus={(event) => {
              event.target.select();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commitAmount();
              }
            }}
            placeholder={String(MIN_INVESTMENT)}
            type="text"
            value={draftAmount}
          />
          <button
            className="h-12 rounded-lg bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-slate-800"
            onClick={() => commitAmount()}
            type="button"
          >
            Aplicar
          </button>
        </div>
      </label>
      <p className="mt-2 text-xs font-bold text-slate-500">
        Minimo {formatKz(MIN_INVESTMENT)}. Maximo {formatKz(BUS_PRICE)}. O
        valor pode ser ajustado depois de escolher o pacote.
      </p>
      <input
        aria-label="Capital a investir"
        className="mt-5 h-2 w-full accent-orange-500"
        max={BUS_PRICE}
        min={MIN_INVESTMENT}
        onChange={(event) => {
          const nextAmount = normalizeInvestment(Number(event.target.value));
          setAmount(nextAmount);
          setDraftAmount(String(nextAmount));
        }}
        step={INVESTMENT_STEP}
        type="range"
        value={plan.amount}
      />
      <div className="mt-5 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Tier atual
            </p>
            <p className="mt-1 text-xl font-black text-slate-950">
              {plan.tier.name}
            </p>
          </div>
          <StatusPill tone={plan.tier.model === "Pool" ? "blue" : "orange"}>
            {plan.tier.model}
          </StatusPill>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-bold text-slate-500">Cota</p>
            <p className="mt-1 text-sm font-black text-slate-950">
              {formatPercent(plan.quota * 100)}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">Garantia</p>
            <p className="mt-1 text-sm font-black text-slate-950">
              {formatPercent(plan.tier.guarantee * 100)} ao ano
            </p>
          </div>
        </div>
        <p className="text-sm leading-6 text-slate-600">{plan.tier.benefit}</p>
      </div>
      <div className="mt-5 rounded-lg bg-slate-950 p-4 text-white">
        <p className="text-sm leading-6 text-slate-300">
          Com <strong className="text-white">{formatKz(plan.amount)}</strong>,
          o investidor financia {formatPercent(plan.quota * 100)} do autocarro
          e recebe cerca de{" "}
          <strong className="text-cyan-200">{formatKz(plan.monthlyReturn)}</strong>{" "}
          por mes, com minimo contratual de{" "}
          <strong className="text-cyan-200">
            {formatKz(plan.monthlyMinimumReturn)}
          </strong>{" "}
          por mes.
        </p>
      </div>
    </div>
  );
}

function ReturnsChart({
  monthlyReturn,
  selectedMonth,
  setSelectedMonth,
}: {
  monthlyReturn: number;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            Ganhos mensais
          </p>
          <h2 className="mt-2 text-xl font-black text-slate-950">
            Ano 1 do investimento demo
          </h2>
        </div>
        <StatusPill tone="green">5 meses pagos</StatusPill>
      </div>

      <div className="mt-6 flex h-64 items-end gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 pb-3 pt-4 sm:gap-3">
        {monthlyReturns.map((item) => {
          const isSelected = selectedMonth === item.month;
          return (
            <button
              className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
              key={item.month}
              onClick={() => setSelectedMonth(item.month)}
              type="button"
            >
              <span
                className={`w-full rounded-t-md transition duration-300 ${
                  item.status === "Pago" ? "bg-orange-500" : "bg-cyan-300"
                } ${isSelected ? "opacity-100 ring-2 ring-slate-950/20" : "opacity-75 group-hover:opacity-100"}`}
                style={{ height: `${item.pulse}%` }}
                title={`${item.month}: ${formatKz(monthlyReturn)}`}
              />
              <span
                className={`text-xs font-black ${
                  isSelected ? "text-slate-950" : "text-slate-500"
                }`}
              >
                {item.month}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PaymentsTable({ monthlyReturn }: { monthlyReturn: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
        Proximos pagamentos
      </p>
      <div className="mt-5 overflow-hidden rounded-lg border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.14em] text-slate-500">
            <tr>
              <th className="px-4 py-3">Mes</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {monthlyReturns.slice(4, 10).map((item) => (
              <tr className="border-t border-slate-200" key={item.month}>
                <td className="px-4 py-3 font-black">{item.month}</td>
                <td className="px-4 py-3 text-slate-600">
                  {formatKz(monthlyReturn)}
                </td>
                <td className="px-4 py-3">
                  <StatusPill tone={item.status === "Pago" ? "green" : "orange"}>
                    {item.status}
                  </StatusPill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActivityFeed() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
        Atividade recente
      </p>
      <div className="mt-5 grid gap-3">
        {investorActivity.map((activity) => (
          <div
            className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 transition hover:border-cyan-200 hover:bg-white"
            key={activity.title}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-orange-600 shadow-sm shadow-slate-950/5">
              <ReceiptText className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-black text-slate-950">
                {activity.title}
              </span>
              <span className="mt-1 block text-xs text-slate-500">
                {activity.detail}
              </span>
            </span>
            <span className="text-xs font-black text-slate-400">
              {activity.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [view, setView] = useState<"landing" | "dashboard">("landing");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [session, setSession] = useState<InvestorSession | null>(null);

  function openAuth(mode: AuthMode) {
    setAuthMode(mode);
    window.requestAnimationFrame(() => {
      document.getElementById("entrar")?.scrollIntoView({ behavior: "smooth" });
    });
  }

  function completeAuth(nextSession: InvestorSession) {
    setSession(nextSession);
    setView("dashboard");
    window.localStorage.setItem("clubInvestorSession", JSON.stringify(nextSession));
  }

  function logout() {
    setSession(null);
    setView("landing");
    window.localStorage.removeItem("clubInvestorSession");
  }

  useEffect(() => {
    const stored = window.localStorage.getItem("clubInvestorSession");
    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored) as InvestorSession;
      if (parsed.accessToken && parsed.account) {
        queueMicrotask(() => {
          setSession(parsed);
          setView("dashboard");
        });
      }
    } catch {
      window.localStorage.removeItem("clubInvestorSession");
    }
  }, []);

  if (view === "dashboard" && session) {
    return <Dashboard onLogout={logout} session={session} />;
  }

  return (
    <>
      <Landing onAuthOpen={openAuth} />
      <AuthPanel
        mode={authMode}
        onComplete={completeAuth}
        onModeChange={setAuthMode}
      />
    </>
  );
}
