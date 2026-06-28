"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");

  async function login() {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin + "/dashboard",
      },
    });

    if (error) alert(error.message);
    else alert("Link de login enviado para o teu email.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8">
        <p className="text-sm uppercase tracking-[0.35em] text-orange-500">TKC Capital OS</p>
        <h1 className="mt-4 text-4xl font-bold">Entrar</h1>
        <p className="mt-3 text-neutral-400">Acesso seguro ao command center.</p>

        <input
          className="mt-8 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none"
          placeholder="email@empresa.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={login}
          className="mt-4 w-full rounded-xl bg-orange-500 px-4 py-3 font-semibold text-black"
        >
          Enviar link de acesso
        </button>

        <a href="/" className="mt-6 block text-center text-sm text-neutral-400">
          Voltar ao início
        </a>
      </div>
    </main>
  );
}
