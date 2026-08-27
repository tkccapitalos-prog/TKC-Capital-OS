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

const TEXT = {
  fr: {
    title: "Premier accès",
    intro: "Créez votre mot de passe et complétez les informations demandées par la direction. Vos services ont déjà été définis avant l'invitation.",
    password: "Mot de passe",
    phone: "Téléphone",
    nationality: "Nationalité",
    jobTitle: "Fonction / poste",
    language: "Langue",
    creating: "Création du compte...",
    create: "Créer l'accès",
    enter: "Entrer dans l'app",
    configMissing: "Supabase n'est pas configuré.",
    inviteRequired: "Ouvrez cette page depuis l'invitation reçue par e-mail.",
    authentication_required: "Ouvrez l'invitation reçue par e-mail avant de continuer.",
    invitation_email_mismatch: "L'invitation ne correspond pas à ce compte.",
    invalid_invitation: "Invitation invalide.",
    expired_or_invalid_invitation: "Invitation expirée ou invalide.",
    missing_profile_fields: "Complétez le téléphone, la nationalité et la fonction.",
    account_mismatch: "Ce profil appartient à un autre compte.",
    operator_profile_not_found: "Profil opérateur introuvable.",
    could_not_complete_account: "Impossible de créer le compte.",
    success: "Compte créé. Votre accès est actif.",
    genericError: "Erreur lors de la création du compte.",
  },
  pt: {
    title: "Primeiro acesso", intro: "Crie a sua palavra-passe e complete os dados pedidos pela direção. Os departamentos já foram definidos antes do convite.", password: "Palavra-passe", phone: "Telefone", nationality: "Nacionalidade", jobTitle: "Função / posto", language: "Língua", creating: "A criar conta...", create: "Criar acesso", enter: "Entrar na app", configMissing: "Supabase não configurado.", inviteRequired: "Abra esta página através do convite recebido por email.", authentication_required: "Abra o convite recebido por email antes de continuar.", invitation_email_mismatch: "O convite não corresponde a esta conta.", invalid_invitation: "Convite inválido.", expired_or_invalid_invitation: "Convite expirado ou inválido.", missing_profile_fields: "Preencha telefone, nacionalidade e função.", account_mismatch: "Este perfil pertence a outra conta.", operator_profile_not_found: "Perfil de operador não encontrado.", could_not_complete_account: "Não foi possível criar a conta.", success: "Conta criada. O seu acesso está ativo.", genericError: "Erro ao criar conta.",
  },
  en: {
    title: "First access", intro: "Create your password and complete the information requested by management. Your departments were assigned before the invitation.", password: "Password", phone: "Phone", nationality: "Nationality", jobTitle: "Role / position", language: "Language", creating: "Creating account...", create: "Create access", enter: "Enter the app", configMissing: "Supabase is not configured.", inviteRequired: "Open this page from the invitation received by email.", authentication_required: "Open the invitation received by email before continuing.", invitation_email_mismatch: "The invitation does not match this account.", invalid_invitation: "Invalid invitation.", expired_or_invalid_invitation: "Expired or invalid invitation.", missing_profile_fields: "Complete phone, nationality and role.", account_mismatch: "This profile belongs to another account.", operator_profile_not_found: "Operator profile not found.", could_not_complete_account: "Could not create the account.", success: "Account created. Your access is active.", genericError: "Error creating the account.",
  },
  es: {
    title: "Primer acceso", intro: "Cree su contraseña y complete los datos solicitados por la dirección. Sus departamentos se asignaron antes de la invitación.", password: "Contraseña", phone: "Teléfono", nationality: "Nacionalidad", jobTitle: "Función / puesto", language: "Idioma", creating: "Creando cuenta...", create: "Crear acceso", enter: "Entrar en la app", configMissing: "Supabase no está configurado.", inviteRequired: "Abra esta página desde la invitación recibida por email.", invitation_email_mismatch: "La invitación no corresponde a esta cuenta.", invalid_invitation: "Invitación inválida.", expired_or_invalid_invitation: "Invitación caducada o inválida.", missing_profile_fields: "Complete teléfono, nacionalidad y función.", account_mismatch: "Este perfil pertenece a otra cuenta.", operator_profile_not_found: "Perfil de operador no encontrado.", could_not_complete_account: "No se pudo crear la cuenta.", success: "Cuenta creada. Su acceso está activo.", genericError: "Error al crear la cuenta.",
  },
  it: {
    title: "Primo accesso", intro: "Crea la password e completa i dati richiesti dalla direzione. I reparti sono stati assegnati prima dell'invito.", password: "Password", phone: "Telefono", nationality: "Nazionalità", jobTitle: "Ruolo / posizione", language: "Lingua", creating: "Creazione account...", create: "Crea accesso", enter: "Entra nell'app", configMissing: "Supabase non è configurato.", inviteRequired: "Apri questa pagina dall'invito ricevuto via email.", invitation_email_mismatch: "L'invito non corrisponde a questo account.", invalid_invitation: "Invito non valido.", expired_or_invalid_invitation: "Invito scaduto o non valido.", missing_profile_fields: "Completa telefono, nazionalità e ruolo.", account_mismatch: "Questo profilo appartiene a un altro account.", operator_profile_not_found: "Profilo operatore non trovato.", could_not_complete_account: "Impossibile creare l'account.", success: "Account creato. L'accesso è attivo.", genericError: "Errore durante la creazione dell'account.",
  },
  pl: {
    title: "Pierwszy dostęp", intro: "Utwórz hasło i uzupełnij dane wymagane przez dyrekcję. Działy zostały przypisane przed wysłaniem zaproszenia.", password: "Hasło", phone: "Telefon", nationality: "Narodowość", jobTitle: "Funkcja / stanowisko", language: "Język", creating: "Tworzenie konta...", create: "Utwórz dostęp", enter: "Wejdź do aplikacji", configMissing: "Supabase nie jest skonfigurowany.", inviteRequired: "Otwórz tę stronę z zaproszenia otrzymanego e-mailem.", invitation_email_mismatch: "Zaproszenie nie pasuje do tego konta.", invalid_invitation: "Nieprawidłowe zaproszenie.", expired_or_invalid_invitation: "Zaproszenie wygasło lub jest nieprawidłowe.", missing_profile_fields: "Uzupełnij telefon, narodowość i stanowisko.", account_mismatch: "Ten profil należy do innego konta.", operator_profile_not_found: "Nie znaleziono profilu operatora.", could_not_complete_account: "Nie udało się utworzyć konta.", success: "Konto utworzone. Dostęp jest aktywny.", genericError: "Błąd podczas tworzenia konta.",
  },
};

function translate(language, key) {
  return TEXT[language]?.[key] || TEXT.fr[key] || key;
}

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
  const t = (key) => translate(form.language, key);

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
      if (!supabase) throw new Error("configMissing");

      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session?.access_token) {
        throw new Error("inviteRequired");
      }
      if ((session.user.email || "").toLowerCase() !== form.email.toLowerCase()) {
        throw new Error("invitation_email_mismatch");
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
        throw new Error(result.error || "could_not_complete_account");
      }

      setStatus("done");
      await supabase.auth.refreshSession();
      setMessage("success");
      setForm((current) => ({ ...current, password: "" }));
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "genericError");
    }
  }

  return (
    <main className="hotel-ops first-login-shell">
      <section className="shell panel first-login-panel">
        <div className="brand-lockup first-login-brand">
          <div className="brand-mark" aria-hidden="true">TKC</div>
          <div>
            <p className="brand-kicker">TKC Capital</p>
            <h1>{t("title")}</h1>
          </div>
        </div>
        <p className="notice">
          {t("intro")}
        </p>

        <form className="operator-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input id="email" type="email" value={form.email} readOnly required />
          </label>
          <label>
            {t("password")}
            <input id="password" type="password" value={form.password} onChange={handleChange} minLength={10} required />
          </label>
          <label>
            {t("phone")}
            <input id="phone" value={form.phone} onChange={handleChange} required />
          </label>
          <label>
            {t("nationality")}
            <input id="nationality" value={form.nationality} onChange={handleChange} required />
          </label>
          <label>
            {t("jobTitle")}
            <input id="jobTitle" value={form.jobTitle} onChange={handleChange} required />
          </label>
          <label>
            {t("language")}
            <select id="language" value={form.language} onChange={handleChange}>
              <option value="fr">Français</option>
              <option value="pt">Português</option>
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="it">Italiano</option>
              <option value="pl">Polski</option>
            </select>
          </label>
          <input id="token" type="hidden" value={form.token} readOnly />
          <div className="actions full">
            <button disabled={status === "loading"} type="submit">
              {status === "loading" ? t("creating") : t("create")}
            </button>
          </div>
        </form>

        {message && <p className={`notice ${status === "error" ? "blocked-text" : "done-text"}`}>{t(message)}</p>}
        {status === "done" && <Link className="button-link" href="/hotel">{t("enter")}</Link>}
      </section>
    </main>
  );
}
