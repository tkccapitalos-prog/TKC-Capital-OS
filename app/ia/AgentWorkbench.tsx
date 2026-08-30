"use client";

import { useState } from "react";
import { agents, buildAgentPrompt, type AgentSensitivity } from "@/lib/agents";

const sensitivityLabels: Record<AgentSensitivity, string> = {
  standard: "Standard",
  sensible: "Données sensibles",
  juridique: "Validation juridique",
};

const sensitivityStyles: Record<AgentSensitivity, string> = {
  standard: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  sensible: "border-amber-400/30 bg-amber-400/10 text-amber-100",
  juridique: "border-rose-400/30 bg-rose-400/10 text-rose-100",
};

export default function AgentWorkbench() {
  const [selectedId, setSelectedId] = useState(agents[0].id);
  const [copied, setCopied] = useState<"prompt" | "example" | null>(null);
  const [copyError, setCopyError] = useState(false);

  const selectedAgent = agents.find((agent) => agent.id === selectedId) ?? agents[0];

  async function copyText(kind: "prompt" | "example", text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyError(false);
      setCopied(kind);
      window.setTimeout(
        () => setCopied((current) => (current === kind ? null : current)),
        1800,
      );
    } catch {
      setCopied(null);
      setCopyError(true);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.4fr]">
      <section className="space-y-3" aria-label="Registre des agents">
        {agents.map((agent) => {
          const selected = agent.id === selectedAgent.id;

          return (
            <button
              key={agent.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setSelectedId(agent.id)}
              className={`w-full rounded-2xl border p-5 text-left transition ${
                selected
                  ? "border-[#c79858] bg-[#c79858]/10"
                  : "border-white/10 bg-white/[0.04] hover:border-white/25 hover:bg-white/[0.07]"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c79858]">
                    {agent.category}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">{agent.name}</h2>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-3 py-1 text-xs ${sensitivityStyles[agent.sensitivity]}`}
                >
                  {sensitivityLabels[agent.sensitivity]}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">{agent.description}</p>
            </button>
          );
        })}
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#0d2238] p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c79858]">
              Agent sélectionné
            </p>
            <h2 className="mt-3 text-3xl font-bold text-white">{selectedAgent.name}</h2>
            <p className="mt-3 max-w-3xl leading-7 text-slate-300">{selectedAgent.mission}</p>
          </div>
          <span className="rounded-full border border-sky-400/30 bg-sky-400/10 px-4 py-2 text-xs font-semibold text-sky-100">
            Sans API · 0 €
          </span>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <InfoList title="Informations nécessaires" items={selectedAgent.inputs} />
          <InfoList title="Livrables" items={selectedAgent.outputs} />
        </div>

        <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/[0.07] p-5">
          <h3 className="font-semibold text-amber-100">Garde-fous</h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-50/80">
            {selectedAgent.guardrails.map((guardrail) => (
              <li key={guardrail} className="flex gap-3">
                <span aria-hidden="true" className="text-[#c79858]">•</span>
                <span>{guardrail}</span>
              </li>
            ))}
          </ul>
        </div>

        {selectedAgent.trustedSources && (
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-5">
            <h3 className="font-semibold text-white">Sources officielles obligatoires</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedAgent.trustedSources.map((source) => (
                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-white/15 px-3 py-2 text-xs text-slate-200 hover:border-[#c79858]/60 hover:text-white"
                >
                  {source.label}
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => copyText("prompt", buildAgentPrompt(selectedAgent))}
            className="rounded-xl bg-[#c79858] px-5 py-3 font-semibold text-[#081421] hover:bg-[#ddb477]"
          >
            {copied === "prompt" ? "Prompt copié" : "Copier le prompt de l'agent"}
          </button>
          <button
            type="button"
            onClick={() => copyText("example", selectedAgent.exampleTasks[0])}
            className="rounded-xl border border-white/15 px-5 py-3 font-semibold text-white hover:bg-white/10"
          >
            {copied === "example" ? "Mission copiée" : "Copier une mission exemple"}
          </button>
          <a
            href="https://claude.ai/new"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-white/15 px-5 py-3 font-semibold text-white hover:bg-white/10"
          >
            Ouvrir Claude
          </a>
        </div>

        <p aria-live="polite" className="mt-3 min-h-6 text-sm text-rose-200">
          {copyError ? "La copie a échoué. Autorise le presse-papiers puis réessaie." : ""}
        </p>

        <div className="mt-5 border-t border-white/10 pt-6">
          <h3 className="font-semibold text-white">Exemples de missions</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {selectedAgent.exampleTasks.map((task) => (
              <button
                key={task}
                type="button"
                onClick={() => copyText("example", task)}
                className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-left text-sm leading-6 text-slate-300 hover:border-white/25 hover:text-white"
              >
                {task}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <h3 className="font-semibold text-white">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            <span aria-hidden="true" className="text-[#c79858]">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
