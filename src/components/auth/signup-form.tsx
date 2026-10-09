"use client";
import {useEffect, useState, type FormEvent} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {authClient} from "@/lib/auth/client";
import {rememberSignupFlash} from "@/lib/feedback/signup-flash";

export function SignupForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [sessionEmail,setSessionEmail] = useState("");

  useEffect(() => {
    void authClient.getSession().then(result => {
      if (result.data?.user?.email) setSessionEmail(result.data.user.email);
    }).catch(() => {});
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setNotice("");
    try {
      const form = new FormData(event.currentTarget);
      const name = String(form.get("name") ?? "").trim();
      const email = (sessionEmail || String(form.get("email") ?? "")).trim().toLowerCase();
      const password = String(form.get("password") ?? "");
      const phone = String(form.get("phone") ?? "").trim();
      if (!sessionEmail) {
        const result = await authClient.signUp.email({name, email, password});
        if (result.error) { setError(result.error.message ?? "Impossible de créer le compte."); return; }
      }
      sessionStorage.setItem("pendingOwnerSignup",JSON.stringify({email,phone}));
      rememberSignupFlash({kind:"owner",email,step:"created"});
      const response = await fetch("/api/account/bootstrap", {
        method: "POST", headers: {"content-type": "application/json"}, body: JSON.stringify({phone}),
      });
      if (response.status === 401) {
        rememberSignupFlash({kind:"owner",email,step:"verify_email"});
        setNotice(`Compte créé pour ${email}. Vérifiez votre email si un message de confirmation vous a été envoyé, puis connectez-vous pour ouvrir votre espace.`);
        return;
      }
      if (!response.ok) { rememberSignupFlash({kind:"owner",email,step:"finish_setup"});setNotice(`Le compte ${email} existe, mais l’espace n’a pas pu être configuré. Connectez-vous pour reprendre.`); return; }
      sessionStorage.removeItem("pendingOwnerSignup");
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("L’opération a été interrompue. Si le compte existe déjà, connectez-vous pour terminer l’espace.");
    } finally {
      setPending(false);
    }
  }

  return <form className="mt-7 grid gap-4 sm:grid-cols-2" onSubmit={submit}>
    {sessionEmail?<p className="text-sm text-slate-600 sm:col-span-2">Compte connecté : <b>{sessionEmail}</b>. Terminez la création de votre espace.</p>:<>
      <label className="text-sm font-medium sm:col-span-2">Nom complet<input name="name" required autoComplete="name" className="mt-2 w-full rounded-xl border p-3.5"/></label>
      <label className="text-sm font-medium sm:col-span-2">Email<input name="email" type="email" required autoComplete="email" className="mt-2 w-full rounded-xl border p-3.5"/></label>
      <label className="text-sm font-medium">Mot de passe<input name="password" type="password" minLength={8} required autoComplete="new-password" className="mt-2 w-full rounded-xl border p-3.5"/></label>
    </>}
    <label className="text-sm font-medium">Téléphone<input name="phone" type="tel" autoComplete="tel" placeholder="+229" className="mt-2 w-full rounded-xl border p-3.5"/></label>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 sm:col-span-2">{error}</p>}
    {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 sm:col-span-2">{notice}</p>}
    {notice && <Link href="/login" className="text-sm font-semibold text-brand-blue sm:col-span-2">Se connecter</Link>}
    <button disabled={pending} className="rounded-xl bg-indigo-600 p-3.5 font-semibold text-white disabled:opacity-60 sm:col-span-2">{pending ? "Création…" : sessionEmail ? "Terminer mon espace" : "Créer mon compte"}</button>
  </form>;
}
