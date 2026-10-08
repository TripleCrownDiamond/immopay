"use client";
import dynamic from "next/dynamic";
import {IsoCity} from "./illustrations";

// The WebGL scene is loaded on the client only; the SVG version shows while it loads.
export const City3DLazy=dynamic(()=>import("./city-3d"),{ssr:false,loading:()=><IsoCity className="mx-auto h-full w-full max-w-[520px]"/>});
export const HeroDevices3DLazy=dynamic(()=>import("./devices-3d").then(m=>m.HeroDevices3D),{ssr:false,loading:()=><div className="h-full w-full"/>});
export const TenantPhones3DLazy=dynamic(()=>import("./devices-3d").then(m=>m.TenantPhones3D),{ssr:false,loading:()=><div className="h-full w-full"/>});
export const AgencyDistrict3DLazy=dynamic(()=>import("./city-3d").then(m=>{const C=m.default;return function AgencyDistrict3D(p:{className?:string}){return <C {...p} variant="agency"/>;};}),{ssr:false,loading:()=><div className="h-full w-full"/>});
