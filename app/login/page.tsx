"use client";

import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  async function loginWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/auth/callback",
      },
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8">
        <p className="text-sm uppercase tracking-[0.35em] text-orange-500">TKC Capital OS</p>
        <h1 className="mt-4 text-4xl font-bold">Entrar</h1>
        <p className="mt-3 text-neutral-400">Acesso seguro ao command center.</p>

        <button
          onClick={loginWithGoogle}
          className="mt-8 w-full rounded-xl bg-white px-4 py-3 font-semibold text-black"
        >
          Entrar com Google
        </button>

        <a href="/" className="mt-6 block text-center text-sm text-neutral-400">
          Voltar ao início
        </a>
      </div>
    </main>
  );
}
