import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
const sans=Plus_Jakarta_Sans({subsets:["latin"],variable:"--font-sans",display:"swap"});
export const metadata: Metadata={title:"ImmoPay",description:"Vos loyers. Automatiquement.",manifest:"/manifest.webmanifest"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="fr" className={sans.variable}><body className="font-sans">{children}</body></html>}
