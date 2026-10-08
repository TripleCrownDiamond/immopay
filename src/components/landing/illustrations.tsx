import type {ReactElement} from "react";
/* Hand-drawn SVG illustrations for the landing page (no raster images). */

type Pt=[number,number];
const S=13, CX=210, CY=120;
// Isometric projection: x goes right-down, y goes left-down, z goes up.
const P=(x:number,y:number,z:number):Pt=>[CX+(x-y)*0.866*S, CY+(x+y)*0.5*S-z*S];
const poly=(pts:Pt[])=>pts.map(p=>p.map(n=>n.toFixed(1)).join(",")).join(" ");

function Block({x,y,w,d,h,floors,cols,tone}:{x:number;y:number;w:number;d:number;h:number;floors:number;cols:[number,number];tone:"a"|"b"}){
  const top=[P(x,y,h),P(x+w,y,h),P(x+w,y+d,h),P(x,y+d,h)];
  const left=[P(x,y+d,0),P(x+w,y+d,0),P(x+w,y+d,h),P(x,y+d,h)];
  const right=[P(x+w,y,0),P(x+w,y+d,0),P(x+w,y+d,h),P(x+w,y,h)];
  const fh=h/floors, wins:ReactElement[]=[];
  for(let f=0;f<floors;f++){
    const z0=f*fh+fh*.28, z1=f*fh+fh*.82;
    // floor slab lines (balconies)
    wins.push(<polygon key={`sl${f}`} points={poly([P(x,y+d+.25,f*fh),P(x+w,y+d+.25,f*fh),P(x+w,y+d+.25,f*fh+.18),P(x,y+d+.25,f*fh+.18)])} fill="#FFFFFF" opacity=".9"/>);
    for(let c=0;c<cols[0];c++){const gw=w/cols[0], a=x+c*gw+gw*.18, b=a+gw*.64;
      wins.push(<polygon key={`l${f}${c}`} points={poly([P(a,y+d,z0),P(b,y+d,z0),P(b,y+d,z1),P(a,y+d,z1)])} fill={(f+c)%3===0?"url(#winLit)":"url(#win)"}/>);}
    for(let c=0;c<cols[1];c++){const gd=d/cols[1], a=y+c*gd+gd*.2, b=a+gd*.6;
      wins.push(<polygon key={`r${f}${c}`} points={poly([P(x+w,a,z0),P(x+w,b,z0),P(x+w,b,z1),P(x+w,a,z1)])} fill="url(#winSide)"/>);}
  }
  return <g>
    <polygon points={poly(left)} fill={tone==="a"?"#F4F7FD":"#EAF0FB"}/>
    <polygon points={poly(right)} fill={tone==="a"?"#C9D5EE":"#BCC9E6"}/>
    <polygon points={poly(top)} fill="#FFFFFF"/>
    <polygon points={poly([P(x,y,h),P(x+w,y,h),P(x+w,y,h+.35),P(x,y,h+.35)])} fill="#DCE4F4"/>
    {wins}
  </g>;
}

function Tree({x,y,r=1.1}:{x:number;y:number;r?:number}){
  const [px,py]=P(x,y,0);
  return <g>
    <ellipse cx={px} cy={py} rx={r*S*.9} ry={r*S*.4} fill="#0B3FD6" opacity=".08"/>
    <rect x={px-1.5} y={py-r*S*1.4} width="3" height={r*S*1.4} rx="1.5" fill="#5B6B8C"/>
    <circle cx={px} cy={py-r*S*1.9} r={r*S*.95} fill="#10C978"/>
    <circle cx={px-r*S*.35} cy={py-r*S*2.15} r={r*S*.5} fill="#5BE3A6" opacity=".8"/>
  </g>;
}

export function IsoCity({className=""}:{className?:string}){
  const ground=[P(-3,-3,0),P(17,-3,0),P(17,11,0),P(-3,11,0)];
  return <svg viewBox="0 0 420 330" className={className} role="img" aria-label="Immeubles gérés avec ImmoPay">
    <defs>
      <linearGradient id="win" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7FB0FF"/><stop offset="1" stopColor="#2F66F2"/></linearGradient>
      <linearGradient id="winLit" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#C9F7E2"/><stop offset="1" stopColor="#10C978"/></linearGradient>
      <linearGradient id="winSide" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#5A8CF5"/><stop offset="1" stopColor="#1D4FD8"/></linearGradient>
      <linearGradient id="ground" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#E3ECFF"/><stop offset="1" stopColor="#D2F5E6"/></linearGradient>
    </defs>
    <polygon points={poly(ground)} fill="url(#ground)"/>
    <polygon points={poly([P(-3,8.6,0),P(17,8.6,0),P(17,10,0),P(-3,10,0)])} fill="#FFFFFF" opacity=".7"/>
    <Block x={0} y={0} w={5} d={4} h={11} floors={6} cols={[3,2]} tone="a"/>
    <Block x={7} y={-1} w={5} d={4} h={8} floors={4} cols={[3,2]} tone="b"/>
    <Block x={3} y={5} w={4} d={2.5} h={5} floors={3} cols={[2,1]} tone="a"/>
    <Tree x={13.5} y={5}/><Tree x={9.5} y={6.5} r={.9}/><Tree x={-1.5} y={7} r={1.2}/><Tree x={14.5} y={8} r={.8}/>
  </svg>;
}

/** Deterministic QR-like pattern (decorative, not a real code). */
export function QrMark({size=72,className=""}:{size?:number;className?:string}){
  const n=21, cells:ReactElement[]=[]; let seed=7;
  const rnd=()=>(seed=(seed*1103515245+12345)%2147483648)/2147483648;
  const finder=(r:number,c:number)=>(r<7&&c<7)||(r<7&&c>=n-7)||(r>=n-7&&c<7);
  for(let r=0;r<n;r++)for(let c=0;c<n;c++){if(!finder(r,c)&&rnd()>.52)cells.push(<rect key={`${r}-${c}`} x={c} y={r} width="1" height="1"/>);}
  const F=({x,y}:{x:number;y:number})=><g><rect x={x} y={y} width="7" height="7" rx="1.4"/><rect x={x+1} y={y+1} width="5" height="5" rx=".9" fill="#fff"/><rect x={x+2} y={y+2} width="3" height="3" rx=".6"/></g>;
  return <svg viewBox={`-1 -1 ${n+2} ${n+2}`} width={size} height={size} className={className} fill="currentColor" aria-hidden="true">
    <rect x="-1" y="-1" width={n+2} height={n+2} rx="2" fill="#fff"/>{cells}<F x={0} y={0}/><F x={n-7} y={0}/><F x={0} y={n-7}/>
  </svg>;
}

export function Sparkline({className=""}:{className?:string}){
  const d="M2 52 C 22 48, 30 40, 46 42 S 70 30, 86 34 S 112 20, 128 24 S 156 10, 178 8";
  return <svg viewBox="0 0 180 60" className={className} aria-hidden="true">
    <defs><linearGradient id="spark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#10C978" stopOpacity=".28"/><stop offset="1" stopColor="#10C978" stopOpacity="0"/></linearGradient></defs>
    <path d={`${d} L178 60 L2 60 Z`} fill="url(#spark)"/>
    <path d={d} fill="none" stroke="#10C978" strokeWidth="3" strokeLinecap="round" className="anim-draw" style={{["--len" as string]:260}}/>
    <circle cx="178" cy="8" r="4" fill="#10C978" className="anim-ping"/>
  </svg>;
}
