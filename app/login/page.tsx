"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";

function getInitialNextPath() {
  if (typeof window === "undefined") return "/dashboard";
  const requested = new URLSearchParams(window.location.search).get("next");
  return requested?.startsWith("/") && !requested.startsWith("//")
    ? requested
    : "/dashboard";
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nextPath] = useState(getInitialNextPath);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function loginWithPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setStatus("error");
      setMessage("Supabase ainda nao esta configurado neste ambiente.");
      return;
    }

    setStatus("loading");
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setStatus("error");
      setMessage("Email ou palavra-passe incorretos.");
      return;
    }

    router.replace(nextPath);
    router.refresh();
  }

  async function loginWithGoogle() {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setStatus("error");
      setMessage("Supabase ainda nao esta configurado neste ambiente.");
      return;
    }

    setStatus("loading");
    setMessage("");
    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("next", nextPath);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback.toString() },
    });

    if (error) {
      setStatus("error");
      setMessage("Nao foi possivel iniciar a entrada com Google.");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b1524] px-5 py-10 text-white">
      <section className="w-full max-w-md rounded-lg border border-[#c79858]/40 bg-white/[0.06] p-7 shadow-2xl">
        <div className="flex items-center gap-4 border-b border-white/10 pb-6">
          <div className="grid size-14 place-items-center rounded-lg border border-[#c79858]/50 bg-[#123c69] text-sm font-black text-[#f7e8ce]">
            TKC
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c79858]">TKC Capital</p>
            <h1 className="mt-1 text-2xl font-bold">Entrar no Capital OS</h1>
          </div>
        </div>

        <form className="mt-6 grid gap-4" onSubmit={loginWithPassword}>
          <label className="grid gap-2 text-sm font-semibold text-slate-200">
            Email
            <input
              className="h-11 rounded-lg border border-white/20 bg-black/20 px-3 text-white outline-none focus:border-[#c79858]"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-200">
            Palavra-passe
            <input
              className="h-11 rounded-lg border border-white/20 bg-black/20 px-3 text-white outline-none focus:border-[#c79858]"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <button
            className="h-11 rounded-lg bg-[#c79858] px-4 font-bold text-[#0b1524] hover:bg-[#ddb477] disabled:opacity-60"
            disabled={status === "loading"}
            type="submit"
          >
            {status === "loading" ? "A entrar..." : "Entrar"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.12em] text-slate-500">
          <span className="h-px flex-1 bg-white/10" />
          ou
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <button
          className="h-11 w-full rounded-lg border border-white/20 bg-white px-4 font-semibold text-[#0b1524] hover:bg-slate-100 disabled:opacity-60"
          disabled={status === "loading"}
          onClick={loginWithGoogle}
          type="button"
        >
          Entrar com Google
        </button>

        {message && <p className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{message}</p>}

        <Link href="/" className="mt-6 block text-center text-sm text-slate-400 hover:text-white">
          Voltar ao inicio
        </Link>
      </section>
    </main>
  );
}
