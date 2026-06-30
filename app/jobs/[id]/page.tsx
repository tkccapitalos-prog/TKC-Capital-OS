import { supabase } from "@/lib/supabase";

export default async function JobDetailPage({ params }: any) {
  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!job) {
    return <main className="min-h-screen bg-black p-10 text-white">Vaga não encontrada.</main>;
  }

  return (
    <main className="min-h-screen bg-[#050505] p-10 text-white">
      <a href="/jobs" className="text-orange-500">← Voltar às vagas</a>

      <section className="mt-8 max-w-3xl">
        <p className="text-sm uppercase tracking-[0.35em] text-orange-500">Fachada Figurada</p>
        <h1 className="mt-4 text-5xl font-bold">{job.title}</h1>
        <p className="mt-4 text-neutral-400">{job.description}</p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 p-5">Distrito: {job.district}</div>
          <div className="rounded-2xl border border-white/10 p-5">Profissão: {job.profession}</div>
          <div className="rounded-2xl border border-white/10 p-5">Quantidade: {job.quantity}</div>
          <div className="rounded-2xl border border-white/10 p-5">Salário: {job.salary || "A combinar"}</div>
        </div>

        <form action="/api/apply" method="post" className="mt-10 grid gap-4">
          <input type="hidden" name="job_id" value={job.id} />
          <input name="full_name" required placeholder="Nome completo" className="rounded-xl bg-white px-4 py-3 text-black" />
          <input name="phone" required placeholder="Telefone" className="rounded-xl bg-white px-4 py-3 text-black" />
          <input name="email" placeholder="Email" className="rounded-xl bg-white px-4 py-3 text-black" />
          <input name="profession" placeholder="Profissão" className="rounded-xl bg-white px-4 py-3 text-black" />
          <input name="district" placeholder="Distrito" className="rounded-xl bg-white px-4 py-3 text-black" />
          <textarea name="experience" placeholder="Experiência" className="rounded-xl bg-white px-4 py-3 text-black" />
          <button className="rounded-xl bg-orange-500 px-4 py-3 font-bold text-black">Enviar candidatura</button>
        </form>
      </section>
    </main>
  );
}
