export default function TalentPage() {
  const stats = [
    ["Vagas abertas", "0"],
    ["Candidatos", "0"],
    ["Entrevistas", "0"],
    ["Prontos para obra", "0"],
  ];

  return (
    <main className="min-h-screen bg-[#050505] p-10 text-white">
      <p className="text-sm uppercase tracking-[0.35em] text-orange-500">Fachada Figurada</p>
      <h1 className="mt-4 text-5xl font-bold">TKC Talent</h1>
      <p className="mt-4 text-neutral-400">Recrutamento inteligente de mão de obra para Portugal.</p>

      <section className="mt-10 grid gap-4 md:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-sm text-neutral-400">{label}</p>
            <h2 className="mt-3 text-3xl font-bold">{value}</h2>
          </div>
        ))}
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        <a href="/talent/nova-vaga" className="rounded-2xl bg-orange-500 p-6 font-bold text-black">+ Nova vaga</a>
        <a href="/talent/vagas" className="rounded-2xl border border-white/10 p-6">Ver vagas</a>
        <a href="/talent/candidatos" className="rounded-2xl border border-white/10 p-6">Ver candidatos</a>
      </section>
    </main>
  );
}
