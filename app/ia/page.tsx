import Link from "next/link";
import type { Metadata } from "next";
import AgentWorkbench from "./AgentWorkbench";

export const metadata: Metadata = {
  title: "Agents IA",
  description: "Registre autonome des agents de TKC Capital OS.",
};

export default function Page() {
  return (
    <main className="min-h-screen bg-[#081421] px-5 py-8 text-white md:px-10 md:py-10">
      <div className="mx-auto max-w-7xl">
        <Link href="/" className="text-sm font-semibold text-[#ddb477] hover:text-white">
          ← Retour au centre de commandement
        </Link>

        <header className="mt-10 grid gap-8 border-b border-white/10 pb-10 lg:grid-cols-[1.4fr_0.6fr] lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#c79858]">
              TKC Intelligence
            </p>
            <h1 className="mt-3 max-w-4xl text-4xl font-bold md:text-6xl">
              Des agents utiles, portables et sans coût d&apos;API.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
              Choisis un agent, copie son prompt et utilise-le dans Codex ou Claude.
              Aucune donnée n&apos;est transmise automatiquement et chaque décision reste humaine.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              ["Agents", "6"],
              ["API", "0"],
              ["Coût", "0 €"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center">
                <p className="text-xs uppercase tracking-wider text-slate-400">{label}</p>
                <p className="mt-2 text-2xl font-bold text-white">{value}</p>
              </div>
            ))}
          </div>
        </header>

        <section className="my-8 rounded-2xl border border-sky-400/20 bg-sky-400/[0.07] p-5 text-sm leading-6 text-sky-50/90">
          <strong>Mode autonome :</strong> colle uniquement le contexte nécessaire à la mission.
          Retire les données médicales, bancaires, les pièces d&apos;identité, les clés et les mots de passe.
          Pour le droit du travail, l&apos;agent doit vérifier les sources officielles en vigueur avant de conclure.
        </section>

        <AgentWorkbench />

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            ["1", "Choisir", "Sélectionne l'agent adapté à la mission."],
            ["2", "Copier", "Copie son prompt complet en un clic."],
            ["3", "Lancer", "Colle-le dans Codex ou dans ton compte Claude."],
            ["4", "Valider", "Contrôle les sources et valide toute action sensible."],
          ].map(([number, title, text]) => (
            <div key={number} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <span className="grid size-9 place-items-center rounded-full bg-[#c79858] font-bold text-[#081421]">
                {number}
              </span>
              <h2 className="mt-4 font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
