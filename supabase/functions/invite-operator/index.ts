import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const APP_URL = "https://app.tkccapital.pt";
const LANGUAGES = new Set(["fr", "pt", "en", "es", "it", "pl"]);
const ROLES = new Set(["operator", "supervisor", "manager", "admin"]);
const DEPARTMENTS = new Set([
  "reception",
  "housekeeping",
  "maintenance",
  "pdj_bar",
  "incidents",
  "handover",
  "direction",
]);

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
    const { data: caller, error: callerError } = await admin
      .from("operator_profiles")
      .select("id, role, status")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (callerError) throw callerError;
    if (!caller || caller.status !== "active" || !["manager", "admin"].includes(caller.role)) {
      throw new HttpError(403, "direction_access_required", "Direction access required");
    }

    const body = await request.json();
    const operator = {
      name: clean(body.name),
      email: clean(body.email).toLowerCase(),
      role: ROLES.has(clean(body.role)) ? clean(body.role) : "operator",
      language: LANGUAGES.has(clean(body.language)) ? clean(body.language) : "fr",
      departments: Array.isArray(body.departments)
        ? [...new Set(body.departments.map(clean).filter((item) => DEPARTMENTS.has(item)))]
        : [],
    };

    if (!operator.name || !operator.email.includes("@")) {
      throw new HttpError(400, "invalid_operator", "Missing operator name or email");
    }
    if (caller.role !== "admin" && ["manager", "admin"].includes(operator.role)) {
      throw new HttpError(403, "admin_role_required", "Only an administrator can create direction access");
    }

    const { data: currentProfile, error: profileLookupError } = await admin
      .from("operator_profiles")
      .select("*")
      .eq("email", operator.email)
      .maybeSingle();

    if (profileLookupError) throw profileLookupError;
    if (currentProfile?.account_status === "active" && currentProfile?.first_login_required === false) {
      throw new HttpError(
        409,
        "account_already_active",
        "O operador ja criou a conta. Use a reposicao de palavra-passe.",
      );
    }

    const profilePayload = {
      email: operator.email,
      full_name: operator.name,
      role: operator.role,
      language: operator.language,
      status: "profile_created",
      account_status: "pending",
      first_login_required: true,
    };

    const profileQuery = currentProfile
      ? admin
          .from("operator_profiles")
          .update(profilePayload)
          .eq("id", currentProfile.id)
          .select("*")
          .single()
      : admin
          .from("operator_profiles")
          .insert({ ...profilePayload, created_by: caller.id })
          .select("*")
          .single();
    const { data: profile, error: profileError } = await profileQuery;

    if (profileError || !profile?.id) throw profileError || new Error("profile_not_stored");

    const { error: deleteDepartmentsError } = await admin
      .from("operator_departments")
      .delete()
      .eq("operator_id", profile.id);
    if (deleteDepartmentsError) throw deleteDepartmentsError;

    if (operator.departments.length > 0) {
      const { error: departmentsError } = await admin
        .from("operator_departments")
        .insert(operator.departments.map((departmentId) => ({
          operator_id: profile.id,
          department_id: departmentId,
        })));
      if (departmentsError) throw departmentsError;
    }

    const now = new Date().toISOString();
    const token = `${crypto.randomUUID()}${crypto.randomUUID().replaceAll("-", "")}`;
    const tokenHash = await sha256(token);

    await admin
      .from("operator_invites")
      .update({ status: "cancelled" })
      .eq("operator_id", profile.id)
      .in("status", ["pending", "sent"]);

    const { data: invitation, error: invitationError } = await admin
      .from("operator_invites")
      .insert({
        operator_id: profile.id,
        email: operator.email,
        token_hash: tokenHash,
        status: "pending",
        created_by: caller.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select("id")
      .single();

    if (invitationError || !invitation?.id) throw invitationError || new Error("invite_not_stored");

    const nextPath = `/first-login?email=${encodeURIComponent(operator.email)}&token=${encodeURIComponent(token)}`;
    const redirectTo = `${APP_URL}/auth/callback?next=${encodeURIComponent(nextPath)}`;
    let authUserId = profile.auth_user_id || null;
    let delivery = "password_recovery";

    if (!authUserId) {
      const { data: invitedUser, error: inviteUserError } = await admin.auth.admin.inviteUserByEmail(
        operator.email,
        {
          redirectTo,
          data: {
            full_name: operator.name,
            language: operator.language,
            operator_profile_id: profile.id,
          },
        },
      );

      if (!inviteUserError && invitedUser?.user?.id) {
        authUserId = invitedUser.user.id;
        delivery = "supabase_invite";
      } else {
        const { data: usersPage, error: listUsersError } = await admin.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });
        if (listUsersError) throw inviteUserError || listUsersError;
        authUserId = usersPage.users.find(
          (item) => (item.email || "").toLowerCase() === operator.email,
        )?.id || null;
        if (!authUserId) throw inviteUserError || new Error("auth_user_not_created");
      }
    }

    if (delivery !== "supabase_invite") {
      const { error: recoveryError } = await publicClient.auth.resetPasswordForEmail(
        operator.email,
        { redirectTo },
      );
      if (recoveryError) throw recoveryError;
    }

    const { error: authMetadataError } = await admin.auth.admin.updateUserById(authUserId, {
      user_metadata: {
        full_name: operator.name,
        language: operator.language,
      },
      app_metadata: {
        operator_profile_id: profile.id,
        role: operator.role,
      },
    });
    if (authMetadataError) throw authMetadataError;

    const { error: profileUpdateError } = await admin
      .from("operator_profiles")
      .update({
        auth_user_id: authUserId,
        invited_at: now,
        invite_count: (Number(profile.invite_count) || 0) + 1,
        last_invite_id: invitation.id,
      })
      .eq("id", profile.id);
    if (profileUpdateError) throw profileUpdateError;

    const { error: inviteStatusError } = await admin
      .from("operator_invites")
      .update({ status: "sent", sent_at: now })
      .eq("id", invitation.id);
    if (inviteStatusError) throw inviteStatusError;

    return json({
      ok: true,
      id: invitation.id,
      delivery,
      production: "supabase_auth_email",
    });
  } catch (error) {
    console.error("invite-operator", error);
    if (error instanceof HttpError) {
      return json({ ok: false, error: error.code, message: error.message }, error.status);
    }
    return json({ ok: false, error: "could_not_create_invitation" }, 502);
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
