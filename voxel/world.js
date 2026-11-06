// The voxel grid and its meshing, kept free of three.js so the tests can run it directly.
import {COLORS,HABITATS,MAT} from './materials.js';
export const CHUNK=32,UNITS=16,BRIDGE_TOP=3,FORT_BLOCK=5;
const SOIL=[116,90,64],WALLS=[[238,230,212],[226,214,190],[214,216,208]],ROOFS=[[176,92,70],[120,124,132],[188,156,112],[92,122,120]];
const BIRDS=[[[244,244,238],[232,190,60]],[[232,132,160],[226,214,190]],[[112,136,160],[220,190,110]],[[240,240,236],[204,76,60]]];
export const hash=(x,z,salt=0)=>{let h=(Math.imul(x,73856093)^Math.imul(z,19349663)^Math.imul(salt,83492791))>>>0;h=Math.imul(h^(h>>>15),2246822519)>>>0;h=Math.imul(h^(h>>>13),3266489917)>>>0;return ((h^(h>>>16))>>>0)/4294967296;};
export function makeWorld(meta,bytes){const {cols,rows}=meta,height=new Int8Array(bytes.buffer,bytes.byteOffset,cols*rows),mat=new Uint8Array(bytes.buffer,bytes.byteOffset+cols*rows,cols*rows);if(bytes.length!==cols*rows*2)throw Error('The voxel grid does not match its description');
 const inside=(x,z)=>x>=0&&z>=0&&x<cols&&z<rows,index=(x,z)=>z*cols+x,materialAt=(x,z)=>inside(x,z)?mat[index(x,z)]:MAT.water,heightAt=(x,z)=>inside(x,z)?height[index(x,z)]:-3;
 const isWater=m=>m===MAT.water||m===MAT.creek||m===MAT.bridge;
 // What a walker stands on: water is waded at the surface, bridges are crossed on their deck, and Fort Clinch's
 // walls, ramparts, and largest buildings are drawn separately, so here they only block the way.
 const walkHeight=(x,z)=>{const m=materialAt(x,z);return m===MAT.bridge?BRIDGE_TOP:isWater(m)?0:m===MAT.fort?heightAt(x,z)+FORT_BLOCK:heightAt(x,z);};
 const habitatAt=(x,z)=>HABITATS[materialAt(x,z)];
 const lengths=[0];for(let i=1;i<meta.route.length;i++)lengths.push(lengths[i-1]+Math.hypot(meta.route[i][0]-meta.route[i-1][0],meta.route[i][1]-meta.route[i-1][1]));
 const routeLength=lengths.at(-1);
 function routePoint(d){const t=Math.max(0,Math.min(routeLength,d));let lo=0,hi=lengths.length-1;while(hi-lo>1){const mid=(lo+hi)>>1;if(lengths[mid]<=t)lo=mid;else hi=mid;}const span=lengths[hi]-lengths[lo]||1,f=(t-lengths[lo])/span,a=meta.route[lo],b=meta.route[hi];return [a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f];}
 function nearestRouteDistance(x,z){let best=0,bestD=Infinity;for(let d=0;d<=routeLength;d+=2){const p=routePoint(d),q=(p[0]-x)**2+(p[1]-z)**2;if(q<bestD){bestD=q;best=d;}}return best;}
 // The way a floater drifts: it changes only when they face clearly back along the route, not just off to one side.
 function floatDirection(d,yaw,current){const a=routePoint(d-3),b=routePoint(d+3),tx=b[0]-a[0],tz=b[1]-a[1],along=-(tx*Math.sin(yaw)+tz*Math.cos(yaw))/(Math.hypot(tx,tz)||1);return along*current<-.17?-current:current;}
 // Places and map clicks can land on a roof, so step outward to the nearest open ground.
 function openGround(x,z){const cx=Math.floor(x),cz=Math.floor(z);for(let r=0;r<12;r++)for(let dz=-r;dz<=r;dz++)for(let dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dz))!==r||!inside(cx+dx,cz+dz))continue;if(materialAt(cx+dx,cz+dz)!==MAT.building)return [cx+dx+.5,cz+dz+.5];}return [cx+.5,cz+.5];}
 return {meta,cols,rows,inside,materialAt,heightAt,walkHeight,habitatAt,isWater,routeLength,routePoint,nearestRouteDistance,floatDirection,openGround};}
export class Mesh{constructor(){this.pos=[];this.col=[];this.idx=[];this.quads=0;}
 quad(a,b,c,d,color,shade=1){const start=this.pos.length/3;for(const p of [a,b,c,d])this.pos.push(p[0],p[1],p[2]);for(let i=0;i<4;i++)this.col.push(Math.min(255,color[0]*shade),Math.min(255,color[1]*shade),Math.min(255,color[2]*shade));this.idx.push(start,start+1,start+2,start,start+2,start+3);this.quads++;}
 top(x0,x1,y,z0,z1,c,s=1){this.quad([x0,y,z0],[x0,y,z1],[x1,y,z1],[x1,y,z0],c,s);}
 bottom(x0,x1,y,z0,z1,c){this.quad([x0,y,z1],[x0,y,z0],[x1,y,z0],[x1,y,z1],c,.55);}
 east(x,y0,y1,z0,z1,c){this.quad([x,y0,z1],[x,y0,z0],[x,y1,z0],[x,y1,z1],c,.72);}
 west(x,y0,y1,z0,z1,c){this.quad([x,y0,z0],[x,y0,z1],[x,y1,z1],[x,y1,z0],c,.84);}
 south(x0,x1,y0,y1,z,c){this.quad([x0,y0,z],[x1,y0,z],[x1,y1,z],[x0,y1,z],c,.92);}
 north(x0,x1,y0,y1,z,c){this.quad([x1,y0,z],[x0,y0,z],[x0,y1,z],[x1,y1,z],c,.64);}
 box(x0,y0,z0,x1,y1,z1,c){this.top(x0,x1,y1,z0,z1,c);this.bottom(x0,x1,y0,z0,z1,c);this.east(x1,y0,y1,z0,z1,c);this.west(x0,y0,y1,z0,z1,c);this.south(x0,x1,y0,y1,z1,c);this.north(x0,x1,y0,y1,z0,c);}
 finish(){if(!this.quads)return null;const positions=new Int16Array(this.pos.length);for(let i=0;i<positions.length;i++)positions[i]=Math.round(this.pos[i]*UNITS);return {positions,colors:Uint8Array.from(this.col),indices:Uint32Array.from(this.idx),quads:this.quads};}}
const tint=(c,f)=>[c[0]*f,c[1]*f,c[2]*f],mix=(a,b,f)=>[a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f,a[2]+(b[2]-a[2])*f];
function pine(m,x,y,z,r){const h=5+Math.floor(r*3),g=[38+r*20,88+r*24,54];m.box(x-.14,y,z-.14,x+.14,y+h,z+.14,[92,66,46]);m.box(x-1.1,y+h-3,z-1.1,x+1.1,y+h-2,z+1.1,g);m.box(x-.8,y+h-2,z-.8,x+.8,y+h-1,z+.8,tint(g,1.08));m.box(x-.45,y+h-1,z-.45,x+.45,y+h+.2,z+.45,tint(g,1.16));}
function oak(m,x,y,z,r){const h=4+Math.floor(r*2),g=[58+r*22,108+r*26,58];m.box(x-.15,y,z-.15,x+.15,y+h,z+.15,[84,66,50]);m.box(x-1.5,y+h,z-1.5,x+1.5,y+h+1.2,z+1.5,g);m.box(x-.9,y+h+1.2,z-.9,x+.9,y+h+2,z+.9,tint(g,1.12));m.box(x+.8,y+h-.5,z-.5,x+.88,y+h,z-.42,[166,172,150]);m.box(x-1,y+h-.6,z+.5,x-.92,y+h,z+.58,[166,172,150]);}
function palm(m,x,y,z,r){const h=3+Math.floor(r*3),g=[84,150,76];m.box(x-.12,y,z-.12,x+.12,y+h,z+.12,[138,112,82]);m.box(x-1.2,y+h,z-.22,x+1.2,y+h+.2,z+.22,g);m.box(x-.22,y+h,z-1.2,x+.22,y+h+.2,z+1.2,g);m.box(x-.3,y+h+.2,z-.3,x+.3,y+h+.5,z+.3,tint(g,1.15));}
// Cordgrass grows in thin upright blades, so each clump is three narrow stems with no hidden undersides.
function cordgrass(m,x,y,z,r,c){for(const [dx,dz,tall] of [[-.14,-.08,1],[.12,-.14,.8],[.02,.14,.9]]){const x0=x+dx-.035,x1=x+dx+.035,z0=z+dz-.035,z1=z+dz+.035,y1=y+(.45+r*.5)*tall;m.top(x0,x1,y1,z0,z1,tint(c,1.08));m.east(x1,y,y1,z0,z1,c);m.west(x0,y,y1,z0,z1,c);m.south(x0,x1,y,y1,z1,c);m.north(x0,x1,y,y1,z0,c);}}
function shrub(m,x,y,z,r,c=[96,130,70]){const w=.3+r*.3;m.box(x-w,y,z-w,x+w,y+.5+r*.5,z+w,c);}
function bird(m,x,y,z,r,kind){const [body,bill]=BIRDS[kind],east=r>.5?1:-1;m.box(x-.05,y,z-.03,x+.03,y+.5,z+.04,[70,66,60]);m.box(x-.3,y+.5,z-.13,x+.3,y+.8,z+.13,body);m.box(x+east*.2,y+.75,z-.05,x+east*.3,y+1.15,z+.05,body);m.box(x+east*.2,y+1.15,z-.07,x+east*.42,y+1.28,z+.07,body);m.box(x+east*.42,y+1.18,z-.03,x+east*.62,y+1.23,z+.03,bill);}
// Each chunk has opaque terrain, translucent water, and distance-culled detail (plants and birds).
export function buildChunk(world,cx,cz){const terrain=new Mesh(),water=new Mesh(),detail=new Mesh(),S=CHUNK;
 for(let z=0;z<S;z++){const wz=cz*S+z;let run=-1;
  for(let x=0;x<=S;x++){const wx=cx*S+x,wet=x<S&&world.inside(wx,wz)&&world.isWater(world.materialAt(wx,wz));
   // Neighbouring water cells share one long quad, which keeps the open ocean cheap.
   const shade=x<S&&wet?world.materialAt(wx,wz):-1,runMat=run>=0?world.materialAt(cx*S+run,wz):-1,same=shade===MAT.bridge?MAT.creek:shade,rs=runMat===MAT.bridge?MAT.creek:runMat;
   if(run>=0&&same!==rs){water.top(run,x,0,z,z+1,COLORS[rs]);run=-1;}
   if(wet&&run<0)run=x;}
  for(let x=0;x<S;x++){const wx=cx*S+x;if(!world.inside(wx,wz))continue;const m=world.materialAt(wx,wz),h=world.heightAt(wx,wz),n=.95+hash(wx,wz)*.1;
   if(m===MAT.bridge){terrain.box(x,BRIDGE_TOP-1,z,x+1,BRIDGE_TOP,z+1,COLORS[m]);}
   if(world.isWater(m)&&h<=-3)continue;
   const building=m===MAT.building,roof=ROOFS[Math.floor(hash(wx,wz,3)*ROOFS.length)],wall=WALLS[Math.floor(hash(wx,wz,4)*WALLS.length)],base=world.isWater(m)?[150,146,108]:building?roof:COLORS[m],color=tint(base,n);
   terrain.top(x,x+1,h,z,z+1,color);
   const natural=m>=MAT.saltmarsh&&m<=MAT.neighborhood,sand=m===MAT.sand,side=building?wall:sand?color:natural?mix(tint(color,.9),SOIL,.6):world.isWater(m)?[120,116,88]:tint(color,.86);
   const sides=[[wx+1,wz,(y0)=>terrain.east(x+1,y0,h,z,z+1,side)],[wx-1,wz,(y0)=>terrain.west(x,y0,h,z,z+1,side)],[wx,wz+1,(y0)=>terrain.south(x,x+1,y0,h,z+1,side)],[wx,wz-1,(y0)=>terrain.north(x,x+1,y0,h,z,side)]];
   for(const [nx,nz,draw] of sides){const low=Math.max(-3,world.heightAt(nx,nz));if(low<h)draw(low);}
   // Plants are scattered by land cover. Birds are illustrative; their spots are not sighting records.
   const r=hash(wx,wz,1),q=hash(wx,wz,2),px=x+.25+hash(wx,wz,5)*.5,pz=z+.25+hash(wx,wz,6)*.5;
   if(m===MAT.forest&&r<.24){if(q<.45)pine(detail,px,h,pz,hash(wx,wz,7));else if(q<.85)oak(detail,px,h,pz,hash(wx,wz,7));else palm(detail,px,h,pz,hash(wx,wz,7));}
   // The Greenway wetland is mostly cordgrass (Spartina), with only an occasional tree or shrub.
   else if(m===MAT.freshwater&&r<.012)(q<.5?oak:palm)(detail,px,h,pz,hash(wx,wz,7));
   else if(m===MAT.freshwater&&r<.03)shrub(detail,px,h,pz,q,[74,132,92]);
   else if(m===MAT.freshwater&&r<.42)cordgrass(detail,px,h,pz,q,[150+q*44,172+q*14,84]);
   else if((m===MAT.neighborhood||m===MAT.lawn)&&r<.035)(q<.6?oak:palm)(detail,px,h,pz,hash(wx,wz,7));
   else if(m===MAT.scrub&&r<.3)shrub(detail,px,h,pz,q);
   else if(m===MAT.sand&&r<.05&&h>=2)shrub(detail,px,h,pz,q,[132,148,88]);
   else if(m===MAT.saltmarsh&&r<.26)cordgrass(detail,px,h,pz,q,[198-q*30,186-q*12,92]);
   if((m===MAT.saltmarsh||m===MAT.freshwater)&&hash(wx,wz,8)<.05&&sides.some(([nx,nz])=>world.materialAt(nx,nz)===MAT.creek))bird(detail,x+.5,h,z+.5,q,Math.floor(hash(wx,wz,9)*BIRDS.length));}}
 return {terrain:terrain.finish(),water:water.finish(),detail:detail.finish()};}
