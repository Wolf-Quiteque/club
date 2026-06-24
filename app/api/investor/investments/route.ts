import { NextResponse } from "next/server";
import {
  calculateInvestmentPlan,
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
  depositBankAccount?: string;
  depositBankIban?: string;
  depositBankName?: string;
  proofFileDataUrl?: string;
  proofFileName?: string;
  proofFileSize?: number;
  proofFileType?: string;
};

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
      id,
      amount,
      created_at,
      deposit_bank_account,
      deposit_bank_iban,
      deposit_bank_name,
      expected_annual_return,
      expected_monthly_return,
      minimum_annual_return,
      package_code,
      package_name,
      proof_file_name,
      proof_file_size,
      proof_file_type,
      proof_uploaded_at,
      status
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

    if (!body.depositBankName || !body.depositBankAccount || !body.depositBankIban) {
      return NextResponse.json(
        { error: "Escolha a conta bancaria usada no deposito." },
        { status: 400 },
      );
    }

    if (!body.proofFileName || !body.proofFileDataUrl) {
      return NextResponse.json(
        { error: "Envie o comprovativo da transferencia." },
        { status: 400 },
      );
    }

    if (body.proofFileDataUrl.length > 7_000_000) {
      return NextResponse.json(
        { error: "O comprovativo e demasiado grande. Use um ficheiro ate 5 MB." },
        { status: 400 },
      );
    }

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
        deposit_bank_account: body.depositBankAccount,
        deposit_bank_iban: body.depositBankIban,
        deposit_bank_name: body.depositBankName,
        expected_annual_return: plan.annualReturn,
        expected_monthly_return: plan.monthlyReturn,
        guarantee_rate: plan.tier.guarantee,
        minimum_annual_return: plan.minimumAnnualReturn,
        monthly_net_profit: plan.monthlyNetProfit,
        package_code: plan.tier.code,
        package_name: plan.tier.name,
        proof_file_data_url: body.proofFileDataUrl,
        proof_file_name: body.proofFileName,
        proof_file_size: body.proofFileSize || null,
        proof_file_type: body.proofFileType || "application/octet-stream",
        proof_uploaded_at: new Date().toISOString(),
        quota: plan.quota,
        route_label: "Luanda-Huambo",
        status: "under_review",
      })
      .select()
      .single();

    if (investmentError || !investment) {
      return NextResponse.json(
        { error: investmentError?.message || "Nao foi possivel criar o investimento." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        account,
        investment,
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
