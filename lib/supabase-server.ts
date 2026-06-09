import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

export function getSupabaseConfigError(requireServiceRole = false) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return "Supabase URL and anon key are required.";
  }

  if (requireServiceRole && !supabaseServiceRoleKey) {
    return "Supabase service role key is required.";
  }

  return null;
}

export function createSupabaseAnonClient() {
  const configError = getSupabaseConfigError(false);
  if (configError) {
    throw new Error(configError);
  }

  return createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function createSupabaseAdminClient() {
  const configError = getSupabaseConfigError(true);
  if (configError) {
    throw new Error(configError);
  }

  return createClient(supabaseUrl!, supabaseServiceRoleKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function getUserFromBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    return { token: null, user: null, error: "Missing bearer token." };
  }

  const supabase = createSupabaseAnonClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return { token, user: null, error: error?.message || "Invalid session." };
  }

  return { token, user: data.user, error: null };
}
