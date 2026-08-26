import { NextResponse } from "next/server";
import {
  DEFAULT_SUPABASE_PUBLISHABLE_KEY,
  DEFAULT_SUPABASE_URL,
} from "@/lib/supabase-config";

export const runtime = "nodejs";

export async function POST(request) {
  const authorization = request.headers.get("authorization") || "";

  if (!authorization.startsWith("Bearer ")) {
    return NextResponse.json(
      { ok: false, error: "Authentication required" },
      { status: 401 },
    );
  }

  const body = await request.text();
  const response = await fetch(
    `${DEFAULT_SUPABASE_URL}/functions/v1/invite-operator`,
    {
      method: "POST",
      headers: {
        apikey: DEFAULT_SUPABASE_PUBLISHABLE_KEY,
        Authorization: authorization,
        "Content-Type": "application/json",
      },
      body,
      cache: "no-store",
    },
  );

  const result = await response.json().catch(() => ({
    ok: false,
    error: "Invalid response from the invitation service",
  }));

  return NextResponse.json(result, { status: response.status });
}
