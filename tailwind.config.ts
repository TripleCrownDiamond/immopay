import type { Config } from "tailwindcss";
export default {
  content:["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme:{extend:{
    colors:{brand:{blue:"#1557FF",deep:"#0B3FD6",green:"#10C978",teal:"#0EA595",ink:"#071440",mist:"#F2F6FF",line:"#E3E9F6"}},
    fontFamily:{sans:["var(--font-sans)","system-ui","sans-serif"]},
  }},
  plugins:[]
} satisfies Config;
