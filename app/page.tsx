import Link from "next/link";

const modules = [
  ["Operações hoteleiras", "Quartos, equipas, tarefas, documentos e chat.", "/hotel"],
  ["IA Executiva", "Centro de decisão com agentes inteligentes.", "/ia"],
  ["Construção", "Obras, orçamentos, equipas e margem.", "/construcao"],
  ["Finanças", "Cashflow, despesas, dívidas e investimentos.", "/financas"],
  ["CRM", "Clientes, leads, parceiros e oportunidades.", "/crm"],
  ["Documentos", "Contratos, circulares, SOPs e arquivos.", "/documentos"],
];

const navigation = [
  ["Dashboard", "/dashboard"],
  ["Operações hoteleiras", "/hotel"],
  ["IA Executiva", "/ia"],
  ["Construção", "/construcao"],
  ["Finanças", "/financas"],
  ["CRM", "/crm"],
  ["Documentos", "/documentos"],
];

const kpis = [
  ["Holding", "TKC Capital", "Ativo"],
  ["Infraestrutura", "Online", "Ready"],
  ["Deploy", "Automático", "Vercel"],
  ["Operações", "Hotel", "Supabase"],
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#081421] text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 border-r border-white/10 bg-[#0d2238] p-6 lg:block">
          <div className="mb-10 flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-lg border border-[#c79858]/50 bg-[#123c69] text-sm font-black text-[#f7e8ce]">
              TKC
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c79858]">TKC Capital</p>
              <h1 className="mt-1 text-xl font-bold">Capital OS</h1>
            </div>
          </div>

          <nav className="space-y-2 text-sm text-slate-300">
            {navigation.map(([item, href]) => (
              <Link key={item} href={href} className="block rounded-lg px-4 py-3 hover:bg-white/10 hover:text-white">
                {item}
              </Link>
            ))}
          </nav>
        </aside>

        <section className="flex-1 p-6 md:p-10">
          <header className="mb-10 flex items-start justify-between gap-6">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#c79858]">
                Holding Command Center
              </p>
              <h2 className="mt-3 max-w-4xl text-4xl font-bold md:text-6xl">TKC Capital OS</h2>
              <p className="mt-4 max-w-2xl text-slate-300">
                Gestão, execução e decisão num único sistema operacional.
              </p>
            </div>

            <div className="hidden rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-5 py-3 text-sm text-emerald-200 md:block">
              Produção online
            </div>
          </header>

          <div className="mb-8 grid gap-4 md:grid-cols-4">
            {kpis.map(([label, value, status]) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
                <p className="text-sm text-slate-400">{label}</p>
                <h3 className="mt-3 text-2xl font-bold">{value}</h3>
                <p className="mt-2 text-xs font-semibold text-[#c79858]">{status}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <section className="rounded-lg border border-white/10 bg-[#0d2238] p-8">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#c79858]">Operações</p>
              <h3 className="mt-4 text-3xl font-bold">
                A equipa hoteleira já pode trabalhar numa única app.
              </h3>
              <p className="mt-5 max-w-2xl text-slate-300">
                Departamentos, housekeeping, binômes, quartos, tarefas, fotos,
                comentários, documentos e chat com acesso controlado pela direção.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/login?next=/hotel" className="rounded-lg bg-[#c79858] px-6 py-3 font-semibold text-[#081421] hover:bg-[#ddb477]">
                  Entrar na app
                </Link>
                <Link href="/hotel" className="rounded-lg border border-white/15 px-6 py-3 hover:bg-white/10">
                  Ver operações
                </Link>
              </div>
            </section>

            <aside className="rounded-lg border border-[#c79858]/30 bg-[#c79858]/10 p-8">
              <p className="text-sm font-semibold text-[#ddb477]">Acessos protegidos</p>
              <h3 className="mt-3 text-2xl font-bold">Ativar serviços privados</h3>
              <p className="mt-4 text-slate-300">
                Convites e criação de contas passam por funções privadas Supabase, sem expor chaves administrativas no código ou na Vercel.
              </p>
            </aside>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {modules.map(([title, text, href]) => (
              <Link key={title} href={href} className="rounded-lg border border-white/10 bg-white/[0.04] p-6 hover:border-[#c79858]/50 hover:bg-white/[0.07]">
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="mt-3 text-slate-400">{text}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
