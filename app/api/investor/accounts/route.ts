import { NextResponse } from "next/server";
import {
  createSupabaseAdminClient,
  getSupabaseConfigError,
} from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type CreateAccountBody = {
  bankName?: string;
  email?: string;
  fullName?: string;
  iban?: string;
  nationalId?: string;
  password?: string;
  phone?: string;
};

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = parts.shift() || fullName.trim();
  const lastName = parts.join(" ");

  return { firstName, lastName };
}

export async function POST(request: Request) {
  try {
    const configError = getSupabaseConfigError(true);
    if (configError) {
      return NextResponse.json({ error: configError }, { status: 500 });
    }

    const body = (await request.json()) as CreateAccountBody;
    const fullName = (body.fullName || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";

    if (!fullName || !email || password.length < 6) {
      return NextResponse.json(
        { error: "Nome, email e palavra-passe de pelo menos 6 caracteres sao obrigatorios." },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdminClient();
    const { firstName, lastName } = splitName(fullName);

    const { data: existingAccount } = await supabase
      .from("club_investor_accounts")
      .select("id, auth_user_id")
      .eq("email", email)
      .maybeSingle();

    if (existingAccount?.auth_user_id) {
      return NextResponse.json(
        { error: "Ja existe uma conta de investidor com este email." },
        { status: 409 },
      );
    }

    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          phone_number: body.phone || null,
          role: "passenger",
        },
      });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || "Nao foi possivel criar o utilizador." },
        { status: 400 },
      );
    }

    const { data: account, error: accountError } = await supabase
      .from("club_investor_accounts")
      .upsert(
        {
          auth_user_id: authData.user.id,
          bank_name: body.bankName || null,
          email,
          full_name: fullName,
          iban: body.iban || null,
          national_id: body.nationalId || null,
          phone: body.phone || null,
          status: "active",
        },
        { onConflict: "email" },
      )
      .select()
      .single();

    if (accountError) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: accountError.message }, { status: 500 });
    }

    return NextResponse.json({ account }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno." },
      { status: 500 },
    );
  }
}
