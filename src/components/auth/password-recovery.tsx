"use client";
import {useState, type FormEvent} from "react";
import Link from "next/link";
import {authClient} from "@/lib/auth/client";
import {requestResetPublicMessage} from "@/lib/auth/password-recovery";

export function PasswordResetRequest() {
  const [pending,setPending]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();setPending(true);setError("");setNotice("");
    try {
      const form=new FormData(event.currentTarget);
      setNotice(await requestResetPublicMessage(String(form.get("email")??""),window.location.origin));
    } catch {setError("La demande est temporairement indisponible. Réessayez plus tard.");}
    finally {setPending(false);}
  }
  return <form onSubmit={submit} className="mt-7 grid gap-4">
    <label className="text-sm font-medium">Email du compte<input name="email" type="email" required autoComplete="email" className="mt-2 w-full rounded-xl border p-3.5"/></label>
    {error&&<p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    {notice&&<p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}
    <button disabled={pending} className="rounded-xl bg-brand-blue p-3.5 font-semibold text-white disabled:opacity-60">{pending?"Envoi…":"Recevoir un lien"}</button>
  </form>;
}

export function PasswordResetFinish({token}:{token:string}) {
  const [pending,setPending]=useState(false);
  const [error,setError]=useState("");
  const [done,setDone]=useState(false);
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();setPending(true);setError("");
    try {
      const form=new FormData(event.currentTarget);
      const password=String(form.get("password")??"");
      const confirm=String(form.get("confirm")??"");
      if(password!==confirm){setError("Les mots de passe ne correspondent pas.");return;}
      const result=await authClient.resetPassword({newPassword:password,token});
      if(result.error){setError("Ce lien est invalide ou expiré. Demandez un nouveau lien.");return;}
      window.history.replaceState(null,"","/reinitialiser-mot-de-passe");
      setDone(true);
    } catch {setError("La réinitialisation a échoué. Réessayez.");}
    finally {setPending(false);}
  }
  if(done)return <div className="mt-7 rounded-xl bg-emerald-50 p-5"><p role="status" className="font-semibold text-emerald-800">Mot de passe mis à jour.</p><Link href="/login" className="mt-3 inline-block text-sm font-bold text-brand-blue">Se connecter</Link></div>;
  return <form onSubmit={submit} className="mt-7 grid gap-4">
    <label className="text-sm font-medium">Nouveau mot de passe<input name="password" type="password" minLength={8} required autoComplete="new-password" className="mt-2 w-full rounded-xl border p-3.5"/></label>
    <label className="text-sm font-medium">Confirmer le mot de passe<input name="confirm" type="password" minLength={8} required autoComplete="new-password" className="mt-2 w-full rounded-xl border p-3.5"/></label>
    {error&&<p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    <button disabled={pending} className="rounded-xl bg-brand-blue p-3.5 font-semibold text-white disabled:opacity-60">{pending?"Mise à jour…":"Changer mon mot de passe"}</button>
  </form>;
}
