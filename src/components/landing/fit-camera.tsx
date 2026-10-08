"use client";
import {useLayoutEffect,type RefObject} from "react";
import {useThree} from "@react-three/fiber";
import * as THREE from "three";

/**
 * Places the camera as close as possible while every mesh inside `target` stays in frame,
 * keeping `margin` of free space (1 = touching the edges). The viewing direction is kept;
 * it re-runs when the canvas is resized. Meshes with `userData.noFit` are ignored.
 */
export function FitCamera({target,dir,margin=.92}:{target:RefObject<THREE.Object3D|null>;dir:[number,number,number];margin?:number}){
  const {camera,size}=useThree();
  useLayoutEffect(()=>{
    const root=target.current;if(!root)return;
    const cam=camera as THREE.PerspectiveCamera;
    root.updateWorldMatrix(true,true);
    const pts:THREE.Vector3[]=[];
    root.traverse(o=>{const m=o as THREE.Mesh;if(!m.isMesh||m.userData.noFit||!m.geometry)return;
      m.geometry.computeBoundingBox();const b=m.geometry.boundingBox!;
      for(let i=0;i<8;i++)pts.push(new THREE.Vector3(i&1?b.max.x:b.min.x,i&2?b.max.y:b.min.y,i&4?b.max.z:b.min.z).applyMatrix4(m.matrixWorld));});
    if(!pts.length)return;
    const center=new THREE.Box3().setFromPoints(pts).getCenter(new THREE.Vector3());
    const d=new THREE.Vector3(...dir).normalize();
    cam.aspect=size.width/size.height;
    // Centre the projected extents, not the 3D box, so the framing is balanced on screen.
    const place=(dist:number,c:THREE.Vector3)=>{cam.position.copy(c).addScaledVector(d,dist);cam.lookAt(c);cam.updateMatrixWorld();cam.updateProjectionMatrix();};
    const extents=()=>{let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;for(const p of pts){const q=p.clone().project(cam);x0=Math.min(x0,q.x);x1=Math.max(x1,q.x);y0=Math.min(y0,q.y);y1=Math.max(y1,q.y);}return {x0,x1,y0,y1};};
    const fits=(dist:number)=>{place(dist,center);const e=extents();return e.x1-e.x0<=2*margin&&e.y1-e.y0<=2*margin;};
    let lo=1,hi=300;for(let i=0;i<40;i++){const mid=(lo+hi)/2;if(fits(mid))hi=mid;else lo=mid;}
    place(hi,center);
    // shift the look-at point so the projected bounds are centred
    const e=extents();const right=new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld,0),up=new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld,1);
    const h=Math.tan(THREE.MathUtils.degToRad(cam.fov/2))*hi;
    const c2=center.clone().addScaledVector(right,(e.x0+e.x1)/2*h*cam.aspect).addScaledVector(up,(e.y0+e.y1)/2*h);
    place(hi,c2);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[camera,size.width,size.height,target,dir.join(),margin]);
  return null;
}
