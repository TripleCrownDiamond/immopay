"use client";

import {useEffect,useRef} from "react";
import {usePathname} from "next/navigation";
import toast, {Toaster} from "react-hot-toast";
import {clearLoginFlashCache,takeSignupFlash} from "@/lib/feedback/signup-flash";

function DestinationFeedback() {
  const pathname = usePathname();
  const previousPath = useRef(pathname);
  useEffect(() => {
    if ((previousPath.current === "/login" || previousPath.current === "/espace-locataire/connexion") && pathname !== previousPath.current) clearLoginFlashCache();
    previousPath.current = pathname;
  },[pathname]);
  useEffect(() => {
    if ((pathname !== "/dashboard" && pathname !== "/espace-locataire") || window.location.pathname !== pathname) return;
    const flash = takeSignupFlash();
    if (flash) toast.success("Compte créé et espace prêt.");
  }, [pathname]);
  useEffect(() => {
    if (pathname !== "/tenants") return;
    try {
      if (sessionStorage.getItem("immopay.tenant-created.v1") !== "1") return;
      sessionStorage.removeItem("immopay.tenant-created.v1");
      toast.success("Locataire ajouté.");
    } catch { /* Storage may be disabled. */ }
  }, [pathname]);
  return null;
}

export function ToastHost() {
  return <><DestinationFeedback/><Toaster position="top-right" toastOptions={{
    duration: 5000,
    style: {borderRadius: "14px", border: "1px solid #dbe3ef", padding: "12px 16px", color: "#17324d"},
    success: {iconTheme: {primary: "#15803d", secondary: "#fff"}},
    error: {iconTheme: {primary: "#b91c1c", secondary: "#fff"}},
  }} /></>;
}
