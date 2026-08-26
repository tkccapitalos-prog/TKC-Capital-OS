import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const APP_URL = "https://app.tkccapital.pt";
const LANGUAGES = new Set(["fr", "pt", "en", "es", "it", "pl"]);
const corsHeaders = {
  "Access-Control-Allow-Origin": APP_URL,
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

class HttpError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);

  try {
    const { admin, publicClient } = createSupabaseClients();
    const user = await authenticate(request, publicClient);
    const body = await request.json();
    const form = {
      email: clean(body.email).toLowerCase(),
      token: clean(body.token),
      phone: clean(body.phone),
      nationality: clean(body.nationality),
      jobTitle: clean(body.jobTitle),
      language: LANGUAGES.has(clean(body.language)) ? clean(body.language) : "fr",
    };

    if (!form.email.includes("@") || !form.token) {
      throw new HttpError(400, "invalid_invitation", "Convite invalido.");
    }
    if (!form.phone || !form.nationality || !form.jobTitle) {
      throw new HttpError(400, "missing_profile_fields", "Preencha telefone, nacionalidade e funcao.");
    }
    if ((user.email || "").toLowerCase() !== form.email) {
      throw new HttpError(403, "invitation_email_mismatch", "O convite nao corresponde a esta conta.");
    }

    const now = new Date().toISOString();
    const tokenHash = await sha256(form.token);
    const { data: invitation, error: inviteError } = await admin
      .from("operator_invites")
      .select("*")
      .eq("email", form.email)
      .eq("token_hash", tokenHash)
      .in("status", ["pending", "sent"])
      .gt("expires_at", now)
      .maybeSingle();

    if (inviteError) throw inviteError;
    if (!invitation?.operator_id) {
      throw new HttpError(400, "expired_or_invalid_invitation", "Convite expirado ou invalido.");
    }

    const { data: profile, error: profileError } = await admin
      .from("operator_profiles")
      .select("*")
      .eq("id", invitation.operator_id)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile || profile.email !== form.email) {
      throw new HttpError(404, "operator_profile_not_found", "Perfil de operador nao encontrado.");
    }
    if (profile.auth_user_id && profile.auth_user_id !== user.id) {
      throw new HttpError(403, "account_mismatch", "Este perfil pertence a outra conta.");
    }

    const { error: userUpdateError } = await admin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...(user.user_metadata || {}),
        full_name: profile.full_name,
        language: form.language,
      },
      app_metadata: {
        ...(user.app_metadata || {}),
        operator_profile_id: profile.id,
        role: profile.role,
      },
    });
    if (userUpdateError) throw userUpdateError;

    const { error: profileUpdateError } = await admin
      .from("operator_profiles")
      .update({
        auth_user_id: user.id,
        phone: form.phone,
        nationality: form.nationality,
        job_title: form.jobTitle,
        language: form.language,
        status: "active",
        account_status: "active",
        first_login_required: false,
        account_created_at: now,
      })
      .eq("id", profile.id);
    if (profileUpdateError) throw profileUpdateError;

    const { error: invitationUpdateError } = await admin
      .from("operator_invites")
      .update({ status: "accepted", accepted_at: now })
      .eq("id", invitation.id);
    if (invitationUpdateError) throw invitationUpdateError;

    await admin
      .from("operator_invites")
      .update({ status: "cancelled" })
      .eq("operator_id", profile.id)
      .neq("id", invitation.id)
      .in("status", ["pending", "sent"]);

    return json({ ok: true, operatorId: profile.id });
  } catch (error) {
    console.error("complete-first-login", error);
    if (error instanceof HttpError) {
      return json({ ok: false, error: error.code, message: error.message }, error.status);
    }
    return json({ ok: false, error: "could_not_complete_account" }, 502);
  }
});

function createSupabaseClients() {
  const url = Deno.env.get("SUPABASE_URL") || "";
  const publishableKey = envDictionary("SUPABASE_PUBLISHABLE_KEYS").default ||
    Deno.env.get("SUPABASE_ANON_KEY") || "";
  const secretKey = envDictionary("SUPABASE_SECRET_KEYS").default ||
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

  if (!url || !publishableKey || !secretKey) {
    throw new HttpError(503, "supabase_configuration_missing", "Supabase configuration is missing");
  }

  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  return {
    publicClient: createClient(url, publishableKey, options),
    admin: createClient(url, secretKey, options),
  };
}

async function authenticate(request: Request, publicClient: ReturnType<typeof createClient>) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!token) throw new HttpError(401, "authentication_required", "Authentication required");

  const { data, error } = await publicClient.auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, "invalid_session", "Invalid or expired session");
  return data.user;
}

function envDictionary(name: string): Record<string, string> {
  try {
    return JSON.parse(Deno.env.get(name) || "{}");
  } catch {
    return {};
  }
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((item) => item.toString(16).padStart(2, "0")).join("");
}

function clean(value: unknown) {
  return String(value || "").trim();
}

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: corsHeaders });
}
