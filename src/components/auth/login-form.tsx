"use client";
import {useEffect, useRef, useState, type FormEvent} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {authClient} from "@/lib/auth/client";
import {takeSignupFlashForLogin, type SignupFlash} from "@/lib/feedback/signup-flash";

function safeDestination(value: string | null, role: string): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/api/")) return null;
  const tenant = value.startsWith("/espace-locataire");
  return tenant === (role === "tenant") ? value : null;
}

async function loadContext(): Promise<Response> {
  let response = await fetch("/api/account/context", {cache: "no-store"});
  for (let attempt = 0; attempt < 2 && (response.status === 401 || response.status >= 500); attempt++) {
    await new Promise(resolve => setTimeout(resolve, 400 * (attempt + 1)));
    response = await fetch("/api/account/context", {cache: "no-store"});
  }
  return response;
}

async function signIn(email: string, password: string) {
  let result: Awaited<ReturnType<typeof authClient.signIn.email>> | undefined;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      result = await authClient.signIn.email({email, password});
      if (!result.error || (result.error.status ?? 0) < 500) return result;
    } catch {
      if (attempt === 1) throw new Error("AUTH_UNAVAILABLE");
    }
  }
  return result!;
}

export function LoginForm({tenant=false}: {tenant?: boolean}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [profileMissing,setProfileMissing] = useState(false);
  const [signupFlash,setSignupFlash] = useState<SignupFlash|null>(null);
  const flashLoaded = useRef(false);

  useEffect(() => {if (flashLoaded.current) return;flashLoaded.current=true;setSignupFlash(takeSignupFlashForLogin());}, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setProfileMissing(false);
    try {
      const form = new FormData(event.currentTarget);
      const email = String(form.get("email") ?? "").trim().toLowerCase();
      const password = String(form.get("password") ?? "");
      const result = await signIn(email, password);
      if (result.error) { setError((result.error.status ?? 0) >= 500 ? "Connexion temporairement indisponible. Réessayez." : "Email ou mot de passe incorrect."); return; }
      let response = await loadContext();
      if (response.status === 404) {
        try {
          const pending=JSON.parse(sessionStorage.getItem("pendingAgencySignup")??"null") as {email?:string;agencyName?:string}|null;
          if (pending?.email===email && pending.agencyName) {
            const bootstrap=await fetch("/api/account/agency",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({agencyName:pending.agencyName})});
            if (bootstrap.ok) {sessionStorage.removeItem("pendingAgencySignup");response=await loadContext();}
          }
        } catch {}
      }
      if (response.status === 404) {
        try {
          const pending=JSON.parse(sessionStorage.getItem("pendingOwnerSignup")??"null") as {email?:string;phone?:string}|null;
          if (pending?.email===email) {
            const bootstrap=await fetch("/api/account/bootstrap",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({phone:pending.phone??""})});
            if (bootstrap.ok) {sessionStorage.removeItem("pendingOwnerSignup");response=await loadContext();}
          }
        } catch {}
      }
      if (!response.ok) {setProfileMissing(response.status===404);setError(response.status === 404 || response.status === 403 ? "Ce compte n’a pas encore d’espace configuré." : "Connexion temporairement indisponible. Réessayez."); return; }
      const context = await response.json() as {role: string; destination: string};
      if (tenant && context.role !== "tenant") { setError("Ce compte ne possède pas d’espace locataire."); return; }
      const params = new URLSearchParams(window.location.search);
      const next = safeDestination(params.get("next") ?? params.get("callbackURL"), context.role);
      router.replace(next ?? context.destination);
      router.refresh();
    } catch {
      setError("La connexion a échoué. Réessayez.");
    } finally {
      setPending(false);
    }
  }

  return <form className="mt-8 space-y-4" onSubmit={submit}>
    {signupFlash && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><strong>Compte créé pour {signupFlash.email}.</strong><p className="mt-1">{signupFlash.step==="verify_email"?"Vérifiez votre email si un message de confirmation vous a été envoyé, puis connectez-vous.":signupFlash.step==="finish_setup"?"Connectez-vous pour terminer la configuration de votre espace.":"Connectez-vous pour accéder à votre espace."}</p></div>}
    <label className="block text-sm font-medium">Email<input name="email" type="email" autoComplete="email" required placeholder="vous@exemple.com" className="mt-2 w-full rounded-xl border p-3.5"/></label>
    <label className="block text-sm font-medium">Mot de passe<input name="password" type="password" autoComplete="current-password" required className="mt-2 w-full rounded-xl border p-3.5"/></label>
    <Link href="/mot-de-passe-oublie" className="block text-right text-sm font-semibold text-brand-blue">Mot de passe oublié ?</Link>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    {profileMissing && !tenant && <div className="grid gap-2 text-sm font-semibold text-brand-blue"><Link href="/signup">Terminer mon espace propriétaire</Link><Link href="/signup/agence">Terminer l’inscription de mon agence</Link></div>}
    <button disabled={pending} className="w-full rounded-xl bg-indigo-600 p-3.5 font-semibold text-white disabled:opacity-60">{pending ? "Connexion…" : "Se connecter"}</button>
  </form>;
}
