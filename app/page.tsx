"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  ChevronRight,
  CircleDollarSign,
  FileCheck2,
  Loader2,
  LockKeyhole,
  Menu,
  ReceiptText,
  ShieldCheck,
  Signal,
  SlidersHorizontal,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";

const BUS_PRICE = 125000000;
const BUS_MONTHLY_NET_PROFIT = 5000000;
const EXPECTED_ANNUAL_ROI = 0.21;
const MIN_INVESTMENT = 1000000;
const INVESTMENT_STEP = 1000000;
const MIN_MONTHLY_NET_PROFIT = 1000000;
const MAX_MONTHLY_NET_PROFIT = 10000000;
const MONTHLY_NET_PROFIT_STEP = 250000;
const RETURN_PERIOD_MONTHS = 12;
const SITE_PASSCODE = "010126";

const investmentTiers = [
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
];

const tierVisuals: Record<
  string,
  {
    badgeClass: string;
    buttonClass: string;
    buttonSelectedClass: string;
    cardClass: string;
    iconClass: string;
    labelClass: string;
  }
> = {
  prata: {
    badgeClass: "tier-badge tier-badge-prata",
    buttonClass: "tier-select-button tier-select-prata",
    buttonSelectedClass: "tier-select-button tier-select-prata tier-select-active",
    cardClass: "tier-card tier-card-prata",
    iconClass: "tier-icon tier-icon-prata",
    labelClass: "tier-label tier-label-prata",
  },
  ouro: {
    badgeClass: "tier-badge tier-badge-ouro",
    buttonClass: "tier-select-button tier-select-ouro",
    buttonSelectedClass: "tier-select-button tier-select-ouro tier-select-active",
    cardClass: "tier-card tier-card-ouro",
    iconClass: "tier-icon tier-icon-ouro",
    labelClass: "tier-label tier-label-ouro",
  },
  diamante: {
    badgeClass: "tier-badge tier-badge-diamante",
    buttonClass: "tier-select-button tier-select-diamante",
    buttonSelectedClass: "tier-select-button tier-select-diamante tier-select-active",
    cardClass: "tier-card tier-card-diamante",
    iconClass: "tier-icon tier-icon-diamante",
    labelClass: "tier-label tier-label-diamante",
  },
};

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

type InvestorInvestment = {
  amount: number | string;
  asset_code?: string;
  created_at?: string;
  deposit_bank_account?: string | null;
  deposit_bank_iban?: string | null;
  deposit_bank_name?: string | null;
  expected_annual_return: number | string;
  expected_monthly_return: number | string;
  id: string;
  minimum_annual_return: number | string;
  package_code: string;
  package_name: string;
  proof_file_name?: string | null;
  proof_file_size?: number | string | null;
  proof_file_type?: string | null;
  proof_uploaded_at?: string | null;
  quota?: number | string;
  route_label?: string;
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
    detail: "Escolha o valor e veja o retorno mensal.",
    icon: SlidersHorizontal,
  },
  {
    title: "Validar perfil",
    detail: "Dados fiscais, identidade e conta de recebimento.",
    icon: ShieldCheck,
  },
  {
    title: "Assinar contrato",
    detail: "Contrato simples com valor, prazo e retorno mensal.",
    icon: FileCheck2,
  },
  {
    title: "Acompanhar ganhos",
    detail: "Pagamentos, relatorios e alertas no portal.",
    icon: ReceiptText,
  },
];

const fleetSignals = [
  { label: "Frota gerida", value: "34", detail: "4 proprios + 30 externos" },
  { label: "Receita 2025", value: "367M", detail: "Kz auditados" },
  { label: "Resultado 2025", value: "116M", detail: "Kz verificados" },
];

const acquisitionAssets = [
  {
    title: "Autocarro 1",
    detail: "Unidade nova para aquisicao.",
    image: "/adiquirir/1.jpeg",
  },
  {
    title: "Autocarro 2",
    detail: "Unidade nova para aquisicao.",
    image: "/adiquirir/2.jpeg",
  },
  {
    title: "Autocarro 3",
    detail: "Unidade nova para aquisicao.",
    image: "/adiquirir/3.jpeg",
  },
  {
    title: "Autocarro 4",
    detail: "Unidade nova para aquisicao.",
    image: "/adiquirir/4.jpeg",
  },
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

async function copyText(value: string) {
  if (!value) {
    return;
  }

  if (navigator.clipboard) {
    await navigator.clipboard.writeText(value);
    return;
  }

  window.prompt("Copie:", value);
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
  const previewAmount = 10000000;
  const previewPlan = calculateInvestmentPlan(previewAmount);

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
            ["Plano", previewPlan.tier.name],
            ["Taxa anual", `${formatPercent(previewPlan.tier.guarantee * 100)} ao ano`],
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
          <p className="text-sm text-slate-400">Retorno mensal total</p>
          <p className="mt-2 text-3xl font-black tracking-tight">
            {formatKz(previewPlan.monthlyReturn)}
          </p>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-cyan-300"
              style={{ width: "21%" }}
            />
          </div>
          <p className="mt-3 text-xs font-bold text-cyan-100">
            Inclui capital dividido em 12 meses + 21% ao ano.
          </p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-xs font-bold text-slate-500">Rendimento</p>
            <p className="mt-1 text-sm font-black text-slate-950">
              {formatKz(previewPlan.monthlyMinimumReturn)}/mes
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

function SiteLock({ onUnlock }: { onUnlock: () => void }) {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [pointer, setPointer] = useState({ x: 50, y: 38 });

  function submitPasscode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedPasscode = passcode.replace(/\D/g, "");

    if (normalizedPasscode !== SITE_PASSCODE) {
      setError("Codigo incorreto. Confirme o passcode e tente novamente.");
      setPasscode("");
      return;
    }

    onUnlock();
  }

  return (
    <main
      className="lock-access-shell relative flex min-h-screen overflow-hidden bg-slate-950 px-4 py-6 text-white sm:px-6 lg:px-8"
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setPointer({
          x: ((event.clientX - rect.left) / rect.width) * 100,
          y: ((event.clientY - rect.top) / rect.height) * 100,
        });
      }}
      style={
        {
          "--lock-x": `${pointer.x}%`,
          "--lock-y": `${pointer.y}%`,
        } as React.CSSProperties
      }
    >
      <div className="absolute inset-0 lock-grid opacity-70" />
      <div className="absolute inset-0 lock-scan opacity-80" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_var(--lock-x)_var(--lock-y),rgba(103,232,249,0.20),transparent_28%),linear-gradient(120deg,rgba(2,6,23,0.96),rgba(15,23,42,0.84)_48%,rgba(249,115,22,0.20))]" />

      <section className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center">
        <div className="grid gap-8 lg:grid-cols-[1fr_27rem] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-lg border border-cyan-200/30 bg-cyan-200/10 px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-100 backdrop-blur-xl">
              <Zap className="h-4 w-4" />
              Acesso privado
            </div>
            <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[0.98] tracking-tight text-white sm:text-7xl">
              Club de investidor Nawabus
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Introduza o passcode para abrir a experiencia privada do clube.
            </p>
          </div>

          <form
            className="relative overflow-hidden rounded-lg border border-white/16 bg-white/10 p-5 shadow-2xl shadow-cyan-950/40 backdrop-blur-2xl"
            onSubmit={submitPasscode}
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-300 via-orange-400 to-cyan-300" />
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-100/80">
                  Terminal seguro
                </p>
                <p className="mt-2 text-2xl font-black text-white">Passcode</p>
              </div>
              <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-cyan-200/25 bg-cyan-200/10 text-cyan-100">
                <LockKeyhole className="h-5 w-5" />
              </span>
            </div>

            <label className="mt-6 block text-sm font-bold text-slate-200">
              Codigo de entrada
              <input
                autoComplete="one-time-code"
                autoFocus
                className="mt-2 h-14 w-full rounded-lg border border-white/15 bg-slate-950/75 px-4 text-center font-mono text-2xl font-black tracking-[0.35em] text-cyan-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/20"
                inputMode="numeric"
                maxLength={6}
                onChange={(event) => {
                  setPasscode(event.target.value.replace(/\D/g, "").slice(0, 6));
                  setError("");
                }}
                placeholder="000000"
                type="password"
                value={passcode}
              />
            </label>

            {error ? (
              <p className="mt-4 rounded-lg border border-orange-300/25 bg-orange-500/12 p-3 text-sm font-bold text-orange-100">
                {error}
              </p>
            ) : null}

            <button
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-cyan-300 px-5 text-sm font-black text-slate-950 shadow-lg shadow-cyan-300/20 transition hover:bg-cyan-200 focus:outline-none focus:ring-4 focus:ring-cyan-300/30"
              type="submit"
            >
              <ShieldCheck className="h-4 w-4" />
              Entra
              <ChevronRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

function TierLadder() {
  return (
    <section className="px-4 pb-18 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-orange-600">
              Pacotes
            </p>
            <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Tres faixas simples. O retorno e mensal.
            </h2>
          </div>
          <StatusPill tone="slate">Prazo: 12 meses</StatusPill>
        </div>
        <div className="mt-8 grid gap-3 lg:grid-cols-3">
          {investmentTiers.map((tier) => {
            const expectedMonthly = calculateInvestmentPlan(tier.min).monthlyReturn;
            const visual = tierVisuals[tier.code];
            const range =
              tier.min === tier.max
                ? formatKz(tier.min)
                : `${formatKz(tier.min)} - ${formatKz(tier.max)}`;

            return (
              <div
                className={visual.cardClass}
                key={tier.name}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className={visual.iconClass} aria-hidden="true" />
                    <p className={visual.labelClass}>
                      Plano
                    </p>
                    <p className="mt-1 text-xl font-black text-slate-950">
                      {tier.name}
                    </p>
                  </div>
                  <span className={visual.badgeClass}>
                    {formatPercent(tier.guarantee * 100)}
                  </span>
                </div>
                <p className="mt-4 text-xs font-bold leading-5 text-slate-500">
                  {range}
                </p>
                <p className="mt-3 text-sm font-black text-slate-950">
                  {formatPercent(tier.guarantee * 100)} ao ano
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Desde {formatKz(expectedMonthly)} por mes. {tier.benefit}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function AssetsToAcquire() {
  return (
    <section className="px-4 pb-18 sm:px-6 lg:px-8" id="activos">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-orange-600">
              Activos para adquirir
            </p>
            <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Novos autocarros que a Nawabus pretende comprar.
            </h2>
          </div>
          <StatusPill tone="slate">4 unidades</StatusPill>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {acquisitionAssets.map((asset) => (
            <div
              className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm shadow-slate-950/5"
              key={asset.title}
            >
              <div className="relative aspect-[4/3] bg-slate-100">
                <Image
                  alt={asset.title}
                  className="object-cover"
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  src={asset.image}
                />
              </div>
              <div className="p-5">
                <p className="text-lg font-black text-slate-950">
                  {asset.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {asset.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PublicSimulationSection() {
  const [amount, setAmount] = useState(5000000);
  const [amountDraft, setAmountDraft] = useState(String(amount));
  const plan = useMemo(
    () => calculateInvestmentPlan(amount),
    [amount],
  );

  const quickAmounts = [
    { label: "1M", value: 1000000 },
    { label: "10M", value: 10000000 },
    { label: "25M", value: 25000000 },
    { label: "50M", value: 50000000 },
    { label: "75M", value: 75000000 },
    { label: "125M", value: BUS_PRICE },
  ];

  function commitAmount(value = amountDraft) {
    const nextAmount = normalizeInvestment(Number(value));
    setAmount(nextAmount);
    setAmountDraft(String(nextAmount));
  }

  function updateAmountDraft(value: string) {
    const digits = value.replace(/\D/g, "");
    setAmountDraft(digits);

    const nextAmount = Number(digits);
    if (nextAmount >= MIN_INVESTMENT && nextAmount <= BUS_PRICE) {
      setAmount(normalizeInvestment(nextAmount));
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
                Digite o valor e veja quanto recebe por mes.
              </h2>
            </div>
            <StatusPill tone="blue">Ate {formatKz(BUS_PRICE)}</StatusPill>
          </div>

          <div className="mt-6 grid gap-4">
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
          </div>

          <div className="mt-5 grid gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Capital rapido
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
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
          </div>

          <div className="mt-5 grid gap-4">
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
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-950 p-5 text-white shadow-2xl shadow-slate-950/20 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
                Resultado da simulacao
              </p>
              <h3 className="mt-2 text-3xl font-black tracking-tight">
                {plan.tier.name}
              </h3>
            </div>
            <StatusPill tone="blue">{plan.tier.model}</StatusPill>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              ["Retorno mensal total", formatKz(plan.monthlyReturn)],
              ["Rendimento mensal", formatKz(plan.monthlyMinimumReturn)],
              ["Rendimento anual", formatKz(plan.minimumAnnualReturn)],
              ["Total em 12 meses", formatKz(plan.annualReturn)],
              ["Taxa do plano", `${formatPercent(plan.expectedAnnualRoi * 100)} ao ano`],
              ["Capital", formatKz(plan.amount)],
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
              Com {formatKz(plan.amount)}, o investidor recebe{" "}
              {formatKz(plan.monthlyReturn)} por mes durante 12 meses. Este
              valor inclui a devolucao do capital e o rendimento anual de{" "}
              {formatPercent(plan.tier.guarantee * 100)}.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}

function Landing() {
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
              <a className="rounded-lg px-3 py-2 hover:bg-white/10" href="#login">
                Login
              </a>
            </nav>
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
              <a className="rounded-lg bg-white/10 px-4 py-3" href="#modelo">
                Modelo
              </a>
              <a className="rounded-lg bg-white/10 px-4 py-3" href="#simulador">
                Simulador
              </a>
              <a className="rounded-lg bg-white/10 px-4 py-3" href="#sinais">
                Sinais
              </a>
              <a className="rounded-lg bg-white/10 px-4 py-3" href="#login">
                Login
              </a>
            </div>
          ) : null}

          <div className="flex flex-1 flex-col justify-center pb-28 pt-12">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-lg border border-cyan-200/25 bg-cyan-200/10 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-100 backdrop-blur-xl">
                <Zap className="h-4 w-4" />
                Clube de Investidor Nawabus
              </div>
              <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[0.98] tracking-tight text-white sm:text-7xl lg:text-8xl">
                Invista na Nawabus. Receba o retorno todos os meses.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
                Escolha um dos tres pacotes, invista a partir de 1M Kz e receba
                o capital mais rendimento dividido em pagamentos mensais.
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
                  icon={<LockKeyhole className="h-4 w-4" />}
                  onClick={() =>
                    document.getElementById("login")?.scrollIntoView({
                      behavior: "smooth",
                    })
                  }
                  tone="ghost"
                >
                  Entrar
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
            detail="Primeira faixa: de 1M Kz a 24.999.999 Kz."
            icon={<TrendingUp className="h-5 w-5" />}
            label="Plano inicial"
            value={`${formatPercent(EXPECTED_ANNUAL_ROI * 100)} ao ano`}
          />
          <Metric
            detail="Pagamentos mensais durante o primeiro ano do investimento."
            icon={<CalendarClock className="h-5 w-5" />}
            label="Prazo"
            value="12 meses"
          />
          <Metric
            detail="Tres pacotes: 21%, 23% e 25% ao ano."
            icon={<CircleDollarSign className="h-5 w-5" />}
            label="Entrada"
            value="1M Kz"
          />
        </div>
      </section>

      <PublicSimulationSection />

      <TierLadder />

      <AssetsToAcquire />

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

function LoginSection({
  onComplete,
}: {
  onComplete: (session: InvestorSession) => void;
}) {
  const [mode, setMode] = useState<"login" | "create">("login");
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [createForm, setCreateForm] = useState({
    bankName: "",
    confirmPassword: "",
    email: "",
    fullName: "",
    iban: "",
    nationalId: "",
    password: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch("/api/investor/session", {
        body: JSON.stringify(form),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Nao foi possivel iniciar sessao.");
      }

      onComplete(result);
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Nao foi possivel iniciar sessao.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function submitCreateAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (createForm.password !== createForm.confirmPassword) {
      setError("As palavras-passe nao coincidem.");
      return;
    }

    setLoading(true);

    try {
      const accountResponse = await fetch("/api/investor/accounts", {
        body: JSON.stringify({
          bankName: createForm.bankName,
          email: createForm.email,
          fullName: createForm.fullName,
          iban: createForm.iban,
          nationalId: createForm.nationalId,
          password: createForm.password,
          phone: createForm.phone,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const accountResult = await accountResponse.json();

      if (!accountResponse.ok) {
        throw new Error(accountResult.error || "Nao foi possivel abrir a conta.");
      }

      const sessionResponse = await fetch("/api/investor/session", {
        body: JSON.stringify({
          email: createForm.email,
          password: createForm.password,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const sessionResult = await sessionResponse.json();

      if (!sessionResponse.ok) {
        setMode("login");
        setForm({
          email: createForm.email,
          password: "",
        });
        setSuccess("Conta criada. Entre com o email e palavra-passe que acabou de definir.");
        return;
      }

      onComplete(sessionResult);
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Nao foi possivel abrir a conta.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className="border-t border-slate-200 bg-slate-50 px-4 py-20 sm:px-6 lg:px-8"
      id="login"
    >
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_26rem] lg:items-center">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-orange-600">
            Clube privado
          </p>
          <h2 className="mt-4 max-w-2xl text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
            Entre no portal ou abra a sua conta.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
            Crie uma conta para escolher um pacote, enviar o comprovativo e
            acompanhar o processo de investimento.
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-950/10">
          <div className="grid grid-cols-2 rounded-lg bg-slate-100 p-1">
            {[
              ["login", "Entrar"],
              ["create", "Abrir conta"],
            ].map(([key, label]) => (
              <button
                className={`h-10 rounded-md text-sm font-black transition ${
                  mode === key
                    ? "bg-slate-950 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-950"
                }`}
                key={key}
                onClick={() => {
                  setMode(key as "login" | "create");
                  setError("");
                  setSuccess("");
                }}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>

          {mode === "login" ? (
            <form onSubmit={submitLogin}>
              <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                Acesso ao portal
              </p>
              <label className="mt-5 block text-sm font-bold text-slate-700">
                Email
                <input
                  className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-300/20"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, email: event.target.value }))
                  }
                  placeholder="email@exemplo.com"
                  required
                  type="email"
                  value={form.email}
                />
              </label>
              <label className="mt-4 block text-sm font-bold text-slate-700">
                Palavra-passe
                <input
                  className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-300/20"
                  minLength={6}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  placeholder="Minimo 6 caracteres"
                  required
                  type="password"
                  value={form.password}
                />
              </label>

              {success ? (
                <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-800">
                  {success}
                </p>
              ) : null}

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
                    <LockKeyhole className="h-4 w-4" />
                  )
                }
                tone="dark"
                type="submit"
              >
                Entrar no portal
              </ActionButton>
            </form>
          ) : (
            <form onSubmit={submitCreateAccount}>
              <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                Nova conta de investidor
              </p>
              <label className="mt-5 block text-sm font-bold text-slate-700">
                Nome completo
                <input
                  className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-300/20"
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      fullName: event.target.value,
                    }))
                  }
                  placeholder="Nome do investidor"
                  required
                  type="text"
                  value={createForm.fullName}
                />
              </label>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-bold text-slate-700">
                  Email
                  <input
                    className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-300/20"
                    onChange={(event) =>
                      setCreateForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    placeholder="email@exemplo.com"
                    required
                    type="email"
                    value={createForm.email}
                  />
                </label>
                <label className="block text-sm font-bold text-slate-700">
                  Telefone
                  <input
                    className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-300/20"
                    inputMode="tel"
                    onChange={(event) =>
                      setCreateForm((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                    placeholder="9xx xxx xxx"
                    required
                    type="tel"
                    value={createForm.phone}
                  />
                </label>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-bold text-slate-700">
                  Palavra-passe
                  <input
                    className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-300/20"
                    minLength={6}
                    onChange={(event) =>
                      setCreateForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    placeholder="Minimo 6 caracteres"
                    required
                    type="password"
                    value={createForm.password}
                  />
                </label>
                <label className="block text-sm font-bold text-slate-700">
                  Confirmar
                  <input
                    className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-300/20"
                    minLength={6}
                    onChange={(event) =>
                      setCreateForm((current) => ({
                        ...current,
                        confirmPassword: event.target.value,
                      }))
                    }
                    placeholder="Repetir palavra-passe"
                    required
                    type="password"
                    value={createForm.confirmPassword}
                  />
                </label>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-bold text-slate-700">
                  BI/NIF
                  <input
                    className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-300/20"
                    onChange={(event) =>
                      setCreateForm((current) => ({
                        ...current,
                        nationalId: event.target.value,
                      }))
                    }
                    placeholder="Opcional"
                    type="text"
                    value={createForm.nationalId}
                  />
                </label>
                <label className="block text-sm font-bold text-slate-700">
                  Banco
                  <input
                    className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-300/20"
                    onChange={(event) =>
                      setCreateForm((current) => ({
                        ...current,
                        bankName: event.target.value,
                      }))
                    }
                    placeholder="Opcional"
                    type="text"
                    value={createForm.bankName}
                  />
                </label>
              </div>
              <label className="mt-4 block text-sm font-bold text-slate-700">
                IBAN para recebimentos
                <input
                  className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-300/20"
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      iban: event.target.value,
                    }))
                  }
                  placeholder="Opcional"
                  type="text"
                  value={createForm.iban}
                />
              </label>

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
                    <ShieldCheck className="h-4 w-4" />
                  )
                }
                tone="dark"
                type="submit"
              >
                Abrir conta
              </ActionButton>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

const bankAccounts = [
  {
    name: "BAI",
    account: "129211703.10.001",
    iban: "AO06.0040.0000.2921.1703.1012.5",
  },
  {
    name: "BFA",
    account: "33608 1032 30 001",
    iban: "AO06.0006.0000.3608.1082.3017.5",
  },
  {
    name: "Standard Bank",
    account: "1003529909",
    iban: "AO06.0060.0140.0100.3529.9093.5",
  },
  {
    name: "Atlantico",
    account: "206468509.10.001",
    iban: "AO06.0055.0000.0646.8509.1019.3",
  },
];

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Nao foi possivel ler o ficheiro."));
    reader.readAsDataURL(file);
  });
}

function Dashboard({
  onLogout,
  session,
}: {
  onLogout: () => void;
  session: InvestorSession;
}) {
  const [amount, setAmount] = useState(5000000);
  const [amountDraft, setAmountDraft] = useState("5000000");
  const [account, setAccount] = useState(session.account);
  const [investments, setInvestments] = useState<InvestorInvestment[]>([]);
  const [dashboardError, setDashboardError] = useState("");
  const [dataLoading, setDataLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedBankName, setSelectedBankName] = useState(bankAccounts[0].name);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  const plan = useMemo(() => calculateInvestmentPlan(amount), [amount]);
  const selectedBank =
    bankAccounts.find((bank) => bank.name === selectedBankName) || bankAccounts[0];

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
        throw new Error(result.error || "Nao foi possivel carregar o portal.");
      }

      setAccount(result.account || session.account);
      setInvestments(result.investments || []);
    } catch (error) {
      setDashboardError(
        error instanceof Error ? error.message : "Nao foi possivel carregar o portal.",
      );
    } finally {
      setDataLoading(false);
    }
  }

  function commitAmount(value = amountDraft) {
    const nextAmount = normalizeInvestment(Number(value));
    setAmount(nextAmount);
    setAmountDraft(String(nextAmount));
  }

  function updateAmountDraft(value: string) {
    const digits = value.replace(/\D/g, "");
    setAmountDraft(digits);

    const nextAmount = Number(digits);
    if (nextAmount >= MIN_INVESTMENT && nextAmount <= BUS_PRICE) {
      setAmount(normalizeInvestment(nextAmount));
    }
  }

  async function submitProof(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDashboardError("");
    setSuccessMessage("");

    if (!proofFile) {
      setDashboardError("Carregue o comprovativo da transferencia.");
      return;
    }

    if (proofFile.size > 5 * 1024 * 1024) {
      setDashboardError("O comprovativo deve ter no maximo 5 MB.");
      return;
    }

    setSubmitting(true);

    try {
      const proofFileDataUrl = await readFileAsDataUrl(proofFile);
      const response = await fetch("/api/investor/investments", {
        body: JSON.stringify({
          amount: plan.amount,
          depositBankAccount: selectedBank.account,
          depositBankIban: selectedBank.iban,
          depositBankName: selectedBank.name,
          proofFileDataUrl,
          proofFileName: proofFile.name,
          proofFileSize: proofFile.size,
          proofFileType: proofFile.type || "application/octet-stream",
        }),
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Nao foi possivel enviar o comprovativo.");
      }

      setAccount(result.account || account);
      setInvestments((current) => [result.investment, ...current]);
      setProofFile(null);
      setSuccessMessage("Comprovativo enviado. A Nawabus vai confirmar o deposito.");
    } catch (error) {
      setDashboardError(
        error instanceof Error ? error.message : "Nao foi possivel enviar o comprovativo.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      refreshInvestments();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.accessToken]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <Image
            alt="Nawabus"
            height={34}
            src="/nawabus_logo_orange.webp"
            width={136}
          />
          <button
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-black text-slate-700"
            onClick={onLogout}
            type="button"
          >
            Sair
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-600">
            Portal do investidor
          </p>
          <h1 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">
            Ola, {account.full_name}
          </h1>
          <p className="mt-2 text-base leading-7 text-slate-600">
            Escolha o pacote, deposite numa das contas Nawabus e envie o comprovativo.
          </p>
        </section>

        {dashboardError ? (
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm font-bold text-orange-800">
            {dashboardError}
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
            {successMessage}
          </div>
        ) : null}

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-black text-slate-950">1. Escolha o pacote</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {investmentTiers.map((tier) => {
              const isSelected = plan.tier.name === tier.name;
              const visual = tierVisuals[tier.code];
              return (
                <button
                  className={
                    isSelected ? visual.buttonSelectedClass : visual.buttonClass
                  }
                  key={tier.name}
                  onClick={() => {
                    const nextAmount = normalizeInvestment(tier.min);
                    setAmount(nextAmount);
                    setAmountDraft(String(nextAmount));
                  }}
                  type="button"
                >
                  <span className="block text-lg font-black">{tier.name}</span>
                  <span className="mt-2 block text-sm">
                    {formatKz(tier.min)} - {formatKz(tier.max)}
                  </span>
                  <span className="mt-2 block text-sm font-black">
                    {formatPercent(tier.guarantee * 100)} ao ano
                  </span>
                </button>
              );
            })}
          </div>

          <label className="mt-5 block text-sm font-bold text-slate-700">
            Valor a investir
            <div className="mt-2 flex gap-2">
              <input
                className="h-12 min-w-0 flex-1 rounded-lg border border-slate-200 px-4 text-lg font-black outline-none focus:border-cyan-400"
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
                className="h-12 rounded-lg bg-slate-950 px-4 text-sm font-black text-white"
                onClick={() => commitAmount()}
                type="button"
              >
                OK
              </button>
            </div>
          </label>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <InfoTile label="Pacote" value={plan.tier.name} />
            <InfoTile label="Recebe por mes" value={formatKz(plan.monthlyReturn)} />
            <InfoTile label="Total em 12 meses" value={formatKz(plan.annualReturn)} />
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-black text-slate-950">2. Deposite numa conta Nawabus</h2>
          <div className="mt-4 grid gap-3">
            {bankAccounts.map((bank) => (
              <label
                className={`block rounded-lg border p-4 ${
                  selectedBank.name === bank.name
                    ? "border-slate-950 bg-slate-50"
                    : "border-slate-200 bg-white"
                }`}
                key={bank.name}
              >
                <div className="flex items-start gap-3">
                  <input
                    checked={selectedBank.name === bank.name}
                    className="mt-1 h-5 w-5 accent-orange-500"
                    name="depositBank"
                    onChange={() => setSelectedBankName(bank.name)}
                    type="radio"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-black text-slate-950">{bank.name}</p>
                    <p className="mt-2 break-words text-sm text-slate-700">
                      Conta: <strong>{bank.account}</strong>
                    </p>
                    <p className="mt-1 break-words text-sm text-slate-700">
                      IBAN: <strong>{bank.iban}</strong>
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black"
                        onClick={(event) => {
                          event.preventDefault();
                          copyText(bank.account);
                        }}
                        type="button"
                      >
                        Copiar conta
                      </button>
                      <button
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black"
                        onClick={(event) => {
                          event.preventDefault();
                          copyText(bank.iban);
                        }}
                        type="button"
                      >
                        Copiar IBAN
                      </button>
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </section>

        <form
          className="rounded-lg border border-slate-200 bg-white p-5"
          onSubmit={submitProof}
        >
          <h2 className="text-xl font-black text-slate-950">3. Envie o comprovativo</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Depois da transferencia, carregue uma foto ou PDF do comprovativo.
          </p>
          <label className="mt-5 block text-sm font-bold text-slate-700">
            Comprovativo
            <input
              accept="image/*,.pdf"
              className="mt-2 block w-full rounded-lg border border-slate-200 bg-white p-3 text-sm"
              onChange={(event) => setProofFile(event.target.files?.[0] || null)}
              required
              type="file"
            />
          </label>
          {proofFile ? (
            <p className="mt-3 text-sm font-bold text-slate-600">
              Ficheiro: {proofFile.name}
            </p>
          ) : null}
          <ActionButton
            className="mt-5 w-full"
            disabled={submitting}
            icon={
              submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileCheck2 className="h-4 w-4" />
              )
            }
            tone="dark"
            type="submit"
          >
            Enviar comprovativo
          </ActionButton>
        </form>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black text-slate-950">Comprovativos enviados</h2>
            {dataLoading ? <Loader2 className="h-5 w-5 animate-spin text-orange-600" /> : null}
          </div>
          <div className="mt-4 grid gap-3">
            {investments.length === 0 ? (
              <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                Ainda nao enviou nenhum comprovativo.
              </p>
            ) : (
              investments.map((investment) => (
                <div
                  className="rounded-lg border border-slate-200 p-4"
                  key={investment.id}
                >
                  <p className="text-base font-black text-slate-950">
                    {investment.package_name} - {formatKz(Number(investment.amount))}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Estado: <strong>{statusText(investment.status)}</strong>
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Comprovativo: <strong>{investment.proof_file_name || "Enviado"}</strong>
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-lg font-black text-slate-950">{value}</p>
    </div>
  );
}
export default function Home() {
  const [view, setView] = useState<"locked" | "landing" | "dashboard">("locked");
  const [session, setSession] = useState<InvestorSession | null>(null);

  function logout() {
    setSession(null);
    setView("landing");
    window.localStorage.removeItem("clubInvestorSession");
  }

  function completeLogin(nextSession: InvestorSession) {
    setSession(nextSession);
    setView("dashboard");
    window.localStorage.setItem("clubInvestorSession", JSON.stringify(nextSession));
  }

  function openUnlockedSite() {
    const stored = window.localStorage.getItem("clubInvestorSession");
    if (!stored) {
      setView("landing");
      return;
    }

    try {
      const parsed = JSON.parse(stored) as InvestorSession;
      if (parsed.accessToken && parsed.account) {
        setSession(parsed);
        setView("dashboard");
        return;
      }
    } catch {
      window.localStorage.removeItem("clubInvestorSession");
    }

    setView("landing");
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
        });
      }
    } catch {
      window.localStorage.removeItem("clubInvestorSession");
    }
  }, []);

  if (view === "locked") {
    return <SiteLock onUnlock={openUnlockedSite} />;
  }

  if (view === "dashboard" && session) {
    return <Dashboard onLogout={logout} session={session} />;
  }

  return (
    <>
      <Landing />
      <LoginSection onComplete={completeLogin} />
    </>
  );
}
