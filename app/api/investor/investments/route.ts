import { randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import {
  calculateInvestmentPlan,
  getReferencePrefix,
  normalizeInvestment,
} from "@/lib/investor";
import {
  createSupabaseAdminClient,
  getSupabaseConfigError,
  getUserFromBearerToken,
} from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CreateInvestmentBody = {
  amount?: number;
};

function getReferenceUrl(request: Request, reference: string) {
  const origin = new URL(request.url).origin;
  return `${origin}/referencias/${encodeURIComponent(reference)}`;
}

function makeReference(packageCode: string) {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = String(randomInt(100000, 999999));
  return `${getReferencePrefix(packageCode)}-${today}-${suffix}`;
}

async function getUniqueReference(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  packageCode: string,
) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const reference = makeReference(packageCode);
    const { data } = await supabase
      .from("club_investment_references")
      .select("id")
      .eq("reference", reference)
      .maybeSingle();

    if (!data) {
      return reference;
    }
  }

  throw new Error("Nao foi possivel gerar uma referencia unica.");
}

async function getInvestorAccount(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  userId: string,
  email: string,
) {
  const { data: existing, error: existingError } = await supabase
    .from("club_investor_accounts")
    .select("*")
    .eq("auth_user_id", userId)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing) {
    return existing;
  }

  const { data: account, error: accountError } = await supabase
    .from("club_investor_accounts")
    .upsert(
      {
        auth_user_id: userId,
        email,
        full_name: email,
        status: "active",
      },
      { onConflict: "email" },
    )
    .select()
    .single();

  if (accountError) {
    throw new Error(accountError.message);
  }

  return account;
}

async function listInvestments(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  accountId: string,
) {
  const { data, error } = await supabase
    .from("club_investments")
    .select(
      `
      *,
      reference:club_investment_references(*)
    `,
    )
    .eq("account_id", accountId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export async function GET(request: Request) {
  try {
    const configError = getSupabaseConfigError(true);
    if (configError) {
      return NextResponse.json({ error: configError }, { status: 500 });
    }

    const auth = await getUserFromBearerToken(request);
    if (auth.error || !auth.user) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const supabase = createSupabaseAdminClient();
    const account = await getInvestorAccount(
      supabase,
      auth.user.id,
      auth.user.email || "",
    );
    const investments = await listInvestments(supabase, account.id);

    return NextResponse.json({ account, investments });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const configError = getSupabaseConfigError(true);
    if (configError) {
      return NextResponse.json({ error: configError }, { status: 500 });
    }

    const auth = await getUserFromBearerToken(request);
    if (auth.error || !auth.user) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const body = (await request.json()) as CreateInvestmentBody;
    const amount = normalizeInvestment(Number(body.amount));
    const plan = calculateInvestmentPlan(amount);
    const supabase = createSupabaseAdminClient();
    const account = await getInvestorAccount(
      supabase,
      auth.user.id,
      auth.user.email || "",
    );

    const { data: investment, error: investmentError } = await supabase
      .from("club_investments")
      .insert({
        account_id: account.id,
        amount: plan.amount,
        asset_code: "NB-2026-014",
        auth_user_id: auth.user.id,
        expected_annual_return: plan.annualReturn,
        expected_monthly_return: plan.monthlyReturn,
        guarantee_rate: plan.tier.guarantee,
        minimum_annual_return: plan.minimumAnnualReturn,
        monthly_net_profit: plan.monthlyNetProfit,
        package_code: plan.tier.code,
        package_name: plan.tier.name,
        quota: plan.quota,
        route_label: "Luanda-Huambo",
        status: "pending_payment",
      })
      .select()
      .single();

    if (investmentError || !investment) {
      return NextResponse.json(
        { error: investmentError?.message || "Nao foi possivel criar o investimento." },
        { status: 500 },
      );
    }

    const reference = await getUniqueReference(supabase, plan.tier.code);
    const referenceUrl = getReferenceUrl(request, reference);
    const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

    const { data: paymentReference, error: referenceError } = await supabase
      .from("club_investment_references")
      .insert({
        amount: plan.amount,
        currency: "AOA",
        entity: "1219",
        expires_at: expiresAt,
        investment_id: investment.id,
        reference,
        reference_url: referenceUrl,
        status: "pending",
      })
      .select()
      .single();

    if (referenceError || !paymentReference) {
      await supabase.from("club_investments").delete().eq("id", investment.id);
      return NextResponse.json(
        { error: referenceError?.message || "Nao foi possivel criar a referencia." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        account,
        investment: {
          ...investment,
          reference: paymentReference,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno." },
      { status: 500 },
    );
  }
}
