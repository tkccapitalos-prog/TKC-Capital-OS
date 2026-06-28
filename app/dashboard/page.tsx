"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  useEffect(() => {
    async function checkUser() {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.push("/login");
        return;
      }

      setEmail(data.user.email || "");
    }

    checkUser();
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-[#050505] p-10 text-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-orange-500">
            TKC Capital OS
          </p>
          <h1 className="mt-3 text-5xl font-bold">Dashboard Executivo</h1>
          <p className="mt-3 text-neutral-400">Sessão ativa: {email}</p>
        </div>

        <button
          onClick={logout}
          className="rounded-full border border-white/20 px-5 py-3 text-sm hover:bg-white/10"
        >
          Sair
        </button>
      </div>

      <section className="mt-12 grid gap-4 md:grid-cols-4">
        {[
          ["Holding", "TKC Capital"],
          ["Status", "Online"],
          ["Supabase", "Ligado"],
          ["Auth", "Ativo"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-sm text-neutral-400">{label}</p>
            <h2 className="mt-3 text-2xl font-bold">{value}</h2>
          </div>
        ))}
      </section>

      <section className="mt-10 rounded-3xl border border-orange-500/30 bg-orange-500/10 p-8">
        <p className="text-sm uppercase tracking-[0.35em] text-orange-500">
          Próxima missão
        </p>
        <h2 className="mt-3 text-3xl font-bold">Construir o módulo Hotel</h2>
        <p className="mt-3 text-neutral-300">
          KPI, forecast, scorecard, reviews, P&L e IA executiva.
        </p>
      </section>
    </main>
  );
}
