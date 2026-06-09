import { NextResponse } from "next/server";
import {
  createSupabaseAdminClient,
  getSupabaseConfigError,
} from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const SMS_API_URL =
  process.env.SMS_API_URL || "https://mimo-sms-rest-api.vercel.app/send-sms";
const SMS_SENDER = process.env.SMS_SENDER || undefined;

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

function toSmsSafeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^\x0A\x0D\x20-\x7E]/g, "")
    .trim();
}

function normalizePhone(phone?: string) {
  const digits = String(phone || "").replace(/\D/g, "");

  if (digits.length === 9 && digits.startsWith("9")) {
    return digits;
  }

  if (digits.length === 12 && digits.startsWith("244")) {
    return digits.slice(-9);
  }

  return digits.slice(-9);
}

async function sendWelcomeSms(fullName: string, phone?: string) {
  const to = normalizePhone(phone);

  if (!to || to.length !== 9) {
    return { sent: false, status: "invalid_phone" };
  }

  const firstName = fullName.trim().split(/\s+/)[0] || "Investidor";
  const text = toSmsSafeText(
    `NAWABUS - Clube de Investidor\n\nOla ${firstName}, a sua conta foi criada com sucesso.\n\nEntre no portal para escolher o pacote, gerar a referencia de investimento e acompanhar o processo.\n\nViajar aqui e facil.`,
  );

  try {
    const response = await fetch(SMS_API_URL, {
      body: JSON.stringify({
        ...(SMS_SENDER ? { sender: SMS_SENDER } : {}),
        text,
        to,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    if (response.ok) {
      return { sent: true, status: "sent" };
    }

    console.error("Welcome SMS API error:", response.status, await response.text());
    return { sent: false, status: "failed" };
  } catch (error) {
    console.error("Welcome SMS send error:", error);
    return { sent: false, status: "failed" };
  }
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
    const phone = normalizePhone(body.phone);

    if (!fullName || !email || password.length < 6) {
      return NextResponse.json(
        { error: "Nome, email e palavra-passe de pelo menos 6 caracteres sao obrigatorios." },
        { status: 400 },
      );
    }

    if (!phone || phone.length !== 9) {
      return NextResponse.json(
        { error: "Telefone angolano valido e obrigatorio para receber SMS." },
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
          phone_number: phone,
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
          phone,
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

    const welcomeSms = await sendWelcomeSms(fullName, phone);

    return NextResponse.json({ account, welcomeSms }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno." },
      { status: 500 },
    );
  }
}
