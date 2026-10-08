"use client";
import {useState, type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {authClient} from "@/lib/auth/client";

export function SignupForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setNotice("");
    try {
      const form = new FormData(event.currentTarget);
      const name = String(form.get("name") ?? "").trim();
      const email = String(form.get("email") ?? "").trim().toLowerCase();
      const password = String(form.get("password") ?? "");
      const phone = String(form.get("phone") ?? "").trim();
      const result = await authClient.signUp.email({name, email, password});
      if (result.error) { setError(result.error.message ?? "Impossible de créer le compte."); return; }
      const response = await fetch("/api/account/bootstrap", {
        method: "POST", headers: {"content-type": "application/json"}, body: JSON.stringify({phone}),
      });
      if (response.status === 401) {
        setNotice("Compte créé. Vérifiez votre email, puis connectez-vous pour ouvrir votre espace.");
        return;
      }
      if (!response.ok) { setError("Le compte est créé, mais l’espace n’a pas pu être configuré. Reconnectez-vous."); return; }
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("La création du compte a échoué. Réessayez.");
    } finally {
      setPending(false);
    }
  }

  return <form className="mt-7 grid gap-4 sm:grid-cols-2" onSubmit={submit}>
    <label className="text-sm font-medium sm:col-span-2">Nom complet<input name="name" required autoComplete="name" className="mt-2 w-full rounded-xl border p-3.5"/></label>
    <label className="text-sm font-medium sm:col-span-2">Email<input name="email" type="email" required autoComplete="email" className="mt-2 w-full rounded-xl border p-3.5"/></label>
    <label className="text-sm font-medium">Mot de passe<input name="password" type="password" minLength={8} required autoComplete="new-password" className="mt-2 w-full rounded-xl border p-3.5"/></label>
    <label className="text-sm font-medium">Téléphone<input name="phone" type="tel" autoComplete="tel" placeholder="+229" className="mt-2 w-full rounded-xl border p-3.5"/></label>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 sm:col-span-2">{error}</p>}
    {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 sm:col-span-2">{notice}</p>}
    <button disabled={pending} className="rounded-xl bg-indigo-600 p-3.5 font-semibold text-white disabled:opacity-60 sm:col-span-2">{pending ? "Création…" : "Créer mon compte"}</button>
  </form>;
}
