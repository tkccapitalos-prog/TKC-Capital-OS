import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const formData = await request.formData();

  const { error } = await supabase.from("applications").insert({
    job_id: formData.get("job_id"),
    full_name: formData.get("full_name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    profession: formData.get("profession"),
    district: formData.get("district"),
    experience: formData.get("experience"),
    status: "Novo",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.redirect(new URL("/jobs?success=1", request.url));
}
