"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function NovaVagaPage() {
  const [form, setForm] = useState({
    title: "",
    work_site: "",
    district: "",
    profession: "",
    quantity: 1,
    salary: "",
    contract_type: "",
    start_date: "",
    duration: "",
    housing: false,
    transport: false,
    priority: "Urgente",
    description: "",
  });

  const [message, setMessage] = useState("");

  function update(field: string, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function createJob() {
    setMessage("A criar vaga...");

    const { error } = await supabase.from("jobs").insert({
      ...form,
      quantity: Number(form.quantity),
      company: "Fachada Figurada",
      status: "Aberta",
    });

    if (error) {
      setMessage("Erro: " + error.message);
      return;
    }

    setMessage("Vaga criada com sucesso. Já aparece no portal público.");
  }

  const generatedAd = `
🚧 A FACHADA FIGURADA ESTÁ A RECRUTAR

Cargo: ${form.profession || "[profissão]"}
Obra: ${form.work_site || "[obra/local]"}
Distrito: ${form.district || "[distrito]"}
Vagas: ${form.quantity || 1}
Salário: ${form.salary || "A combinar"}
Início: ${form.start_date || "Imediato"}
Duração: ${form.duration || "A combinar"}

Procuramos profissionais sérios, disponíveis e com experiência em construção civil.

Interessados devem enviar:
- Nome
- Telefone
- Profissão
- Experiência
- Cidade
- Disponibilidade

Fachada Figurada
Construção com seriedade.
`;

  return (
    <main className="min-h-screen bg-[#050505] p-10 text-white">
      <a href="/talent" className="text-orange-500">← Voltar</a>
      <h1 className="mt-8 text-4xl font-bold">Nova vaga</h1>
      <p className="mt-3 text-neutral-400">Criar recrutamento para a Fachada Figurada Portugal.</p>

      <section className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="grid gap-4">
          <input placeholder="Título da vaga" className="rounded-xl bg-white px-4 py-3 text-black" onChange={(e) => update("title", e.target.value)} />
          <input placeholder="Nome da obra" className="rounded-xl bg-white px-4 py-3 text-black" onChange={(e) => update("work_site", e.target.value)} />
          <input placeholder="Distrito" className="rounded-xl bg-white px-4 py-3 text-black" onChange={(e) => update("district", e.target.value)} />
          <input placeholder="Profissão" className="rounded-xl bg-white px-4 py-3 text-black" onChange={(e) => update("profession", e.target.value)} />
          <input type="number" placeholder="Quantidade" className="rounded-xl bg-white px-4 py-3 text-black" onChange={(e) => update("quantity", e.target.value)} />
          <input placeholder="Salário" className="rounded-xl bg-white px-4 py-3 text-black" onChange={(e) => update("salary", e.target.value)} />
          <input placeholder="Tipo de contrato" className="rounded-xl bg-white px-4 py-3 text-black" onChange={(e) => update("contract_type", e.target.value)} />
          <input type="date" className="rounded-xl bg-white px-4 py-3 text-black" onChange={(e) => update("start_date", e.target.value)} />
          <input placeholder="Duração prevista" className="rounded-xl bg-white px-4 py-3 text-black" onChange={(e) => update("duration", e.target.value)} />
          <textarea placeholder="Descrição da vaga" className="rounded-xl bg-white px-4 py-3 text-black" onChange={(e) => update("description", e.target.value)} />

          <label className="flex gap-3 text-neutral-300">
            <input type="checkbox" onChange={(e) => update("housing", e.target.checked)} />
            Alojamento incluído
          </label>

          <label className="flex gap-3 text-neutral-300">
            <input type="checkbox" onChange={(e) => update("transport", e.target.checked)} />
            Transporte incluído
          </label>

          <button onClick={createJob} className="rounded-xl bg-orange-500 px-4 py-3 font-bold text-black">
            Publicar vaga
          </button>

          {message && <p className="text-orange-500">{message}</p>}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-2xl font-bold">Anúncio gerado</h2>
          <pre className="mt-4 whitespace-pre-wrap text-sm text-neutral-300">{generatedAd}</pre>
        </div>
      </section>
    </main>
  );
}
