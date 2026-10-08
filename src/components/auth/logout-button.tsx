"use client";
import {useState} from "react";
import {authClient} from "@/lib/auth/client";

export function LogoutButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  return <button type="button" disabled={pending} onClick={async () => {
    setPending(true);
    setError(false);
    try {
      let response = await authClient.signOut();
      if (response.error && (response.error.status ?? 0) >= 500) response = await authClient.signOut();
      if (response.error) throw new Error("SIGN_OUT_FAILED");
      window.location.assign("/");
    } catch { setError(true); setPending(false); }
  }} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50">
    {pending ? "Déconnexion…" : error ? "Réessayer la déconnexion" : "Se déconnecter"}
  </button>;
}
