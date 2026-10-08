"use client";
import {useState, type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {authClient} from "@/lib/auth/client";

export function AgencySignupForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true); setError(""); setNotice("");
    try {
      const form = new FormData(event.currentTarget);
      const name = String(form.get("name") ?? "").trim();
      const agencyName = String(form.get("agencyName") ?? "").trim();
      const email = String(form.get("email") ?? "").trim().toLowerCase();
      const password = String(form.get("password") ?? "");
      const result = await authClient.signUp.email({name, email, password});
      if (result.error) {setError(result.error.message ?? "Impossible de créer le compte."); return;}
      const response = await fetch("/api/account/agency", {method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({agencyName})});
      if (response.status === 401) {setNotice("Compte créé. Vérifiez votre email, puis reconnectez-vous pour ouvrir votre agence."); return;}
      if (!response.ok) {setError("Compte créé, mais l’agence n’a pas pu être configurée. Reconnectez-vous pour réessayer."); return;}
      router.replace("/dashboard"); router.refresh();
    } catch {setError("La création du compte a échoué. Réessayez.");}
    finally {setPending(false);}
  }
  return <form className="mt-7 grid gap-4" onSubmit={submit}>
    <label className="text-sm font-medium">Votre nom<input name="name" required autoComplete="name" className="mt-2 w-full rounded-xl border p-3.5"/></label>
    <label className="text-sm font-medium">Nom de l’agence<input name="agencyName" required minLength={2} maxLength={120} className="mt-2 w-full rounded-xl border p-3.5"/></label>
    <label className="text-sm font-medium">Email professionnel<input name="email" type="email" required autoComplete="email" className="mt-2 w-full rounded-xl border p-3.5"/></label>
    <label className="text-sm font-medium">Mot de passe<input name="password" type="password" minLength={8} required autoComplete="new-password" className="mt-2 w-full rounded-xl border p-3.5"/></label>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}
    <button disabled={pending} className="rounded-xl bg-indigo-600 p-3.5 font-semibold text-white disabled:opacity-60">{pending?"Création…":"Créer mon agence"}</button>
  </form>;
}
