import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function JobsPage() {
  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-[#050505] p-10 text-white">
      <p className="text-sm uppercase tracking-[0.35em] text-orange-500">Fachada Figurada</p>
      <h1 className="mt-4 text-5xl font-bold">Portal de Emprego</h1>
      <p className="mt-4 text-neutral-400">Vagas abertas em Portugal.</p>

      <div className="mt-6 rounded-xl border border-orange-500/40 p-4 text-sm">
        <p>Debug jobs: {jobs ? jobs.length : 0}</p>
        <p>Erro: {error ? error.message : "sem erro"}</p>
      </div>

      <section className="mt-10 grid gap-4">
        {(jobs || []).map((job: any) => (
          <a key={job.id} href={`/jobs/${job.id}`} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-2xl font-bold">{job.title}</h2>
            <p className="mt-2 text-neutral-400">{job.district} · {job.profession} · {job.quantity} vaga(s)</p>
            <p className="mt-3 text-orange-500">Candidatar-me →</p>
          </a>
        ))}
      </section>
    </main>
  );
}
