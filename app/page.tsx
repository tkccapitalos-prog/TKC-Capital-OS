const modules = [
  ["IA Executiva", "Centro de decisão com agentes inteligentes."],
  ["Hotel", "Performance, reviews, forecast, equipas e ações."],
  ["Construção", "Obras, orçamentos, equipas e margem."],
  ["Finanças", "Cashflow, despesas, dívidas e investimentos."],
  ["CRM", "Clientes, leads, parceiros e oportunidades."],
  ["Documentos", "Contratos, cartas, propostas e arquivos."]
];

const kpis = [
  ["Holding", "TKC Capital", "Ativo"],
  ["Infraestrutura", "Online", "Ready"],
  ["Deploy", "Automático", "Vercel"],
  ["Cloud", "Google", "Ligado"]
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 border-r border-white/10 bg-white/[0.03] p-6 lg:block">
          <div className="mb-10">
            <p className="text-xs tracking-[0.4em] text-orange-500">TKC</p>
            <h1 className="mt-2 text-2xl font-bold">Capital OS</h1>
          </div>

          <nav className="space-y-3 text-sm text-neutral-300">
            {[
              ["Dashboard", "/dashboard"],
              ["IA Executiva", "/ia"],
              ["Hotel", "/hotel"],
              ["Construção", "/construcao"],
              ["Finanças", "/financas"],
              ["CRM", "/crm"],
              ["Documentos", "/documentos"],
              ["Configurações", "/dashboard"]
            ].map(([item, href]) => (
              <a key={item} href={href} className="block rounded-xl px-4 py-3 hover:bg-white/10">
                {item}
              </a>
            ))}
          </nav>
        </aside>

        <section className="flex-1 p-6 md:p-10">
          <header className="mb-10 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-orange-500">
                Holding Command Center
              </p>
              <h2 className="mt-3 text-4xl font-bold md:text-6xl">
                Crescer a holding com inteligência.
              </h2>
            </div>

            <div className="hidden rounded-full border border-white/10 px-5 py-3 text-sm text-neutral-300 md:block">
              Status: <span className="text-green-400">Online</span>
            </div>
          </header>

          <div className="mb-8 grid gap-4 md:grid-cols-4">
            {kpis.map(([label, value, status]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <p className="text-sm text-neutral-400">{label}</p>
                <h3 className="mt-3 text-2xl font-bold">{value}</h3>
                <p className="mt-2 text-xs text-orange-400">{status}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-8">
              <p className="text-sm uppercase tracking-[0.3em] text-orange-500">
                Missão
              </p>
              <h3 className="mt-4 text-3xl font-bold">
                Transformar gestão, execução e decisão num único sistema.
              </h3>
              <p className="mt-5 max-w-2xl text-neutral-300">
                A TKC Capital OS centraliza hotelaria, construção, finanças,
                CRM, documentos e IA para acelerar decisões e criar ativos
                digitais escaláveis.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <a href="/login" className="rounded-full bg-orange-500 px-6 py-3 font-semibold text-black">
                  Abrir Dashboard
                </a>
                <button className="rounded-full border border-white/15 px-6 py-3">
                  Ver Roadmap
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-orange-500/20 bg-orange-500/10 p-8">
              <p className="text-sm text-orange-300">Próxima ação</p>
              <h3 className="mt-3 text-2xl font-bold">Construir login e base de dados</h3>
              <p className="mt-4 text-neutral-300">
                Próximo passo: autenticação, Supabase e estrutura real dos módulos.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {modules.map(([title, text]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="mt-3 text-neutral-400">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
