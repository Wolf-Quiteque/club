import { NextResponse } from "next/server";
import {
  createSupabaseAdminClient,
  createSupabaseAnonClient,
  getSupabaseConfigError,
} from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type SessionBody = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  try {
    const configError = getSupabaseConfigError(true);
    if (configError) {
      return NextResponse.json({ error: configError }, { status: 500 });
    }

    const body = (await request.json()) as SessionBody;
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e palavra-passe sao obrigatorios." },
        { status: 400 },
      );
    }

    const authClient = createSupabaseAnonClient();
    const { data: sessionData, error: signInError } =
      await authClient.auth.signInWithPassword({ email, password });

    if (signInError || !sessionData.session || !sessionData.user) {
      return NextResponse.json(
        { error: signInError?.message || "Credenciais invalidas." },
        { status: 401 },
      );
    }

    const admin = createSupabaseAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("first_name, last_name, phone_number, national_id")
      .eq("id", sessionData.user.id)
      .maybeSingle();

    const fallbackName =
      [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
      sessionData.user.email ||
      "Investidor";

    const { data: account, error: accountError } = await admin
      .from("club_investor_accounts")
      .upsert(
        {
          auth_user_id: sessionData.user.id,
          email,
          full_name: fallbackName,
          national_id: profile?.national_id || null,
          phone: profile?.phone_number || null,
          status: "active",
        },
        { onConflict: "email" },
      )
      .select()
      .single();

    if (accountError) {
      return NextResponse.json({ error: accountError.message }, { status: 500 });
    }

    return NextResponse.json({
      accessToken: sessionData.session.access_token,
      account,
      expiresAt: sessionData.session.expires_at,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno." },
      { status: 500 },
    );
  }
}
