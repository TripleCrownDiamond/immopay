"use client";
import {useState, type FormEvent} from "react";
import {useRouter} from "next/navigation";

export function TenantForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError("");
    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch("/api/tenants", {method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({
        fullName:String(form.get("fullName")??""), email:String(form.get("email")??""), phone:String(form.get("phone")??""),
      })});
      if (!response.ok) {setError(response.status===403?"Accès refusé.":"Vérifiez le nom et l’adresse email du locataire."); return;}
      try {sessionStorage.setItem("immopay.tenant-created.v1","1");} catch { /* Storage may be disabled. */ }
      router.replace("/tenants"); router.refresh();
    } catch {setError("Impossible d’ajouter ce locataire. Réessayez.");}
    finally {setPending(false);}
  }
  return <form onSubmit={submit} className="mt-7 grid max-w-xl gap-4 rounded-2xl border border-brand-line bg-white p-6 shadow-sm">
    <label className="text-sm font-medium">Nom complet<input name="fullName" required minLength={2} maxLength={120} autoComplete="name" className="mt-2 w-full rounded-xl border p-3"/></label>
    <label className="text-sm font-medium">Email<input name="email" type="email" required autoComplete="email" className="mt-2 w-full rounded-xl border p-3"/></label>
    <label className="text-sm font-medium">Téléphone (facultatif)<input name="phone" type="tel" autoComplete="tel" className="mt-2 w-full rounded-xl border p-3"/></label>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    <button disabled={pending} className="rounded-xl bg-brand-blue p-3 font-semibold text-white disabled:opacity-60">{pending?"Ajout…":"Ajouter le locataire"}</button>
  </form>;
}
