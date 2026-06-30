import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CandidatosPage() {
  const { data: applications, error } = await supabase
    .from("applications")
    .select(`
      id,
      full_name,
      phone,
      email,
      profession,
      district,
      availability,
      experience,
      status,
      created_at,
      jobs (
        title
      )
    `)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-[#050505] p-10 text-white">
      <a href="/talent" className="text-orange-500">← Voltar</a>

      <div className="mt-8 flex items-end justify-between gap-6">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-orange-500">TKC Talent</p>
          <h1 className="mt-4 text-5xl font-bold">Candidatos</h1>
          <p className="mt-3 text-neutral-400">Candidaturas recebidas pelo portal de emprego.</p>
        </div>

        <a href="/jobs" className="rounded-xl bg-orange-500 px-5 py-3 font-bold text-black">
          Ver portal público
        </a>
      </div>

      {error && (
        <div className="mt-8 rounded-xl border border-red-500/40 p-4 text-red-300">
          Erro: {error.message}
        </div>
      )}

      <section className="mt-10 grid gap-4">
        {(applications || []).map((app: any) => (
          <div key={app.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">{app.full_name}</h2>
                <p className="mt-2 text-neutral-400">
                  {app.profession || "Profissão não indicada"} · {app.district || "Distrito não indicado"}
                </p>
                <p className="mt-1 text-neutral-500">
                  Vaga: {app.jobs?.title || "Sem vaga associada"}
                </p>
              </div>

              <span className="rounded-full border border-orange-500/40 px-4 py-2 text-sm text-orange-500">
                {app.status || "Novo"}
              </span>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-white/10 p-4">
                <p className="text-xs text-neutral-500">Telefone</p>
                <p className="mt-1">{app.phone || "-"}</p>
              </div>
              <div className="rounded-xl border border-white/10 p-4">
                <p className="text-xs text-neutral-500">Email</p>
                <p className="mt-1">{app.email || "-"}</p>
              </div>
              <div className="rounded-xl border border-white/10 p-4">
                <p className="text-xs text-neutral-500">Disponibilidade</p>
                <p className="mt-1">{app.availability || "-"}</p>
              </div>
            </div>

            {app.experience && (
              <div className="mt-4 rounded-xl border border-white/10 p-4">
                <p className="text-xs text-neutral-500">Experiência</p>
                <p className="mt-2 text-neutral-300">{app.experience}</p>
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              {app.phone && (
                <a
                  href={`https://wa.me/${String(app.phone).replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  className="rounded-xl bg-green-600 px-4 py-2 font-bold text-white"
                >
                  WhatsApp
                </a>
              )}
              {app.email && (
                <a
                  href={`mailto:${app.email}`}
                  className="rounded-xl border border-white/10 px-4 py-2"
                >
                  Email
                </a>
              )}
            </div>
          </div>
        ))}

        {(!applications || applications.length === 0) && !error && (
          <div className="rounded-2xl border border-white/10 p-6 text-neutral-400">
            Ainda não há candidaturas.
          </div>
        )}
      </section>
    </main>
  );
}
