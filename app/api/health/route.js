import {
  DEFAULT_SUPABASE_PROJECT_ID,
  DEFAULT_SUPABASE_PUBLISHABLE_KEY,
  DEFAULT_SUPABASE_URL,
} from "@/lib/supabase-config";

export function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_PUBLISHABLE_KEY;
  return Response.json({
    ok: true,
    service: "tkc-hotel-ops",
    production: {
      appUrl: process.env.APP_PUBLIC_URL || "https://app.tkccapital.pt",
      supabaseClientConfigured: Boolean(supabaseUrl && publishableKey),
      supabaseAdminConfigured: true,
      adminMode: "supabase_edge_functions",
      invitationsConfigured: true,
      invitationEmailProvider: "supabase_auth",
      supabaseProject: process.env.SUPABASE_PROJECT_ID || DEFAULT_SUPABASE_PROJECT_ID
    },
    timestamp: new Date().toISOString()
  });
}
