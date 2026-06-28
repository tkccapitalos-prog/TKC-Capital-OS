export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="flex min-h-screen flex-col justify-center px-8 md:px-20">
        <div className="max-w-5xl">
          <p className="mb-4 text-sm uppercase tracking-[0.35em] text-orange-500">
            TKC Capital OS
          </p>

          <h1 className="text-5xl font-bold tracking-tight md:text-7xl">
            O teu sistema operativo empresarial.
          </h1>

          <p className="mt-8 max-w-2xl text-lg text-neutral-300 md:text-xl">
            Gestão, IA, finanças, hotelaria, construção, documentos e automações
            numa única plataforma inteligente.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <a className="rounded-full bg-orange-500 px-6 py-3 font-semibold text-black">
              Entrar no Dashboard
            </a>
            <a className="rounded-full border border-white/20 px-6 py-3 text-white">
              Ver módulos
            </a>
          </div>

          <div className="mt-16 grid gap-4 md:grid-cols-3">
            {[
              ["IA Executiva", "Agentes para decisão, análise e execução."],
              ["Gestão Empresarial", "Hotel, construção, finanças e CRM."],
              ["Automação", "Processos inteligentes ligados ao teu ecossistema."]
            ].map(([title, text]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-xl font-semibold">{title}</h2>
                <p className="mt-3 text-neutral-400">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
