"use client";

import {Toaster} from "react-hot-toast";

export function ToastHost() {
  return <Toaster position="top-right" toastOptions={{
    duration: 5000,
    style: {borderRadius: "14px", border: "1px solid #dbe3ef", padding: "12px 16px", color: "#17324d"},
    success: {iconTheme: {primary: "#15803d", secondary: "#fff"}},
    error: {iconTheme: {primary: "#b91c1c", secondary: "#fff"}},
  }} />;
}
