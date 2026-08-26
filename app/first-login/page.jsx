"use client";

import { useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase";

const initialForm = {
  email: "",
  token: "",
  password: "",
  phone: "",
  nationality: "",
  jobTitle: "",
  language: "fr"
};

function getInitialForm() {
  if (typeof window === "undefined") return initialForm;
  const params = new URLSearchParams(window.location.search);
  return {
    ...initialForm,
    email: params.get("email") || "",
    token: params.get("token") || ""
  };
}

export default function FirstLoginPage() {
  const [form, setForm] = useState(getInitialForm);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  function handleChange(event) {
    const { id, value } = event.target;
    setForm((current) => ({ ...current, [id]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error("Supabase nao configurado.");

      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session?.access_token) {
        throw new Error("Abra esta pagina atraves do convite recebido por email.");
      }
      if ((session.user.email || "").toLowerCase() !== form.email.toLowerCase()) {
        throw new Error("O convite nao corresponde a esta conta.");
      }

      const { error: passwordError } = await supabase.auth.updateUser({
        password: form.password,
      });
      if (passwordError) throw passwordError;

      const response = await fetch("/api/operators/complete-first-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: form.email,
          token: form.token,
          phone: form.phone,
          nationality: form.nationality,
          jobTitle: form.jobTitle,
          language: form.language,
        }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "could_not_create_account");
      }

      setStatus("done");
      await supabase.auth.refreshSession();
      setMessage("Conta criada. O seu acesso esta ativo.");
      setForm((current) => ({ ...current, password: "" }));
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "Erro ao criar conta.");
    }
  }

  return (
    <main className="hotel-ops first-login-shell">
      <section className="shell panel first-login-panel">
        <div className="brand-lockup first-login-brand">
          <div className="brand-mark" aria-hidden="true">TKC</div>
          <div>
            <p className="brand-kicker">TKC Capital</p>
            <h1>Primeiro login</h1>
          </div>
        </div>
        <p className="notice">
          Crie a sua palavra-passe e complete os dados pedidos pela direcao.
          Os departamentos ja foram definidos antes do convite.
        </p>

        <form className="operator-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input id="email" type="email" value={form.email} readOnly required />
          </label>
          <label>
            Palavra-passe
            <input id="password" type="password" value={form.password} onChange={handleChange} minLength={10} required />
          </label>
          <label>
            Telefone
            <input id="phone" value={form.phone} onChange={handleChange} required />
          </label>
          <label>
            Nacionalidade
            <input id="nationality" value={form.nationality} onChange={handleChange} required />
          </label>
          <label>
            Funcao / posto
            <input id="jobTitle" value={form.jobTitle} onChange={handleChange} required />
          </label>
          <label>
            Lingua
            <select id="language" value={form.language} onChange={handleChange}>
              <option value="fr">Francais</option>
              <option value="pt">Portugues</option>
              <option value="en">English</option>
              <option value="es">Espanol</option>
              <option value="it">Italiano</option>
              <option value="pl">Polski</option>
            </select>
          </label>
          <input id="token" type="hidden" value={form.token} readOnly />
          <div className="actions full">
            <button disabled={status === "loading"} type="submit">
              {status === "loading" ? "A criar conta..." : "Criar acesso"}
            </button>
          </div>
        </form>

        {message && <p className={`notice ${status === "error" ? "blocked-text" : "done-text"}`}>{message}</p>}
        {status === "done" && <Link className="button-link" href="/hotel">Entrar na app</Link>}
      </section>
    </main>
  );
}
