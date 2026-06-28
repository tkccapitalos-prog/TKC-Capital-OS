import { redirect } from "next/navigation";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#050505] p-10 text-white">
      <a href="/" className="text-orange-500">← Voltar</a>

      <section className="mt-10">
        <p className="text-sm uppercase tracking-[0.35em] text-orange-500">
          TKC Capital OS
        </p>
        <h1 className="mt-4 text-5xl font-bold">Dashboard Executivo</h1>
        <p className="mt-4 text-neutral-400">
          Área privada da holding. Login Supabase ligado.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {[
            ["Status", "Online"],
            ["Supabase", "Ligado"],
            ["Auth", "Preparado"],
            ["Holding", "TKC Capital"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <p className="text-sm text-neutral-400">{label}</p>
              <h2 className="mt-3 text-2xl font-bold">{value}</h2>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
