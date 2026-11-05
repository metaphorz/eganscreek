// Fort Clinch, built from its mapped plan at finer detail than the 10 m terrain blocks.
// The terrain's tenfold height stretch would turn these low walls into slabs, so heights here are only mildly raised.
import {Mesh} from './world.js';
export const WALL=2.6,BASTION=3.1,RAMPART=1.8,RAMPART_TOE=.7;
const BRICK=[158,86,62],BRICK_TOP=[132,76,58],STONE=[186,178,158],GRASS=[122,162,86],BANK=[106,148,76],WALK=[190,184,166],ROOF=[112,116,120],WOOD=[150,118,82],IRON=[34,36,38],SLIT=[70,44,36];
const lerp=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
// Where neighbouring curtain lines meet, which gives the plain pentagon that the rampart rings follow.
function cornerOf(a,b){const [p,q]=a,[r,s]=b,d1=[q[0]-p[0],q[1]-p[1]],d2=[s[0]-r[0],s[1]-r[1]],den=d1[0]*d2[1]-d1[1]*d2[0],t=((r[0]-p[0])*d2[1]-(r[1]-p[1])*d2[0])/den;return lerp(p,q,t);}
export function fortPlan(fort){const {curtains,center}=fort,corners=curtains.map((c,i)=>cornerOf(curtains[(i+curtains.length-1)%curtains.length],c)),ring=t=>corners.map(k=>lerp(center,k,t));
 const gateEdge=curtains.findIndex(([a,b])=>Math.abs(Math.hypot(a[0]-fort.gate[0],a[1]-fort.gate[1])+Math.hypot(b[0]-fort.gate[0],b[1]-fort.gate[1])-Math.hypot(a[0]-b[0],a[1]-b[1]))<.5);if(gateEdge<0)throw Error('The gate is not on a curtain wall');return {corners,ring,gateEdge};}
export const insidePolygon=(poly,x,z)=>{let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [ax,az]=poly[i],[bx,bz]=poly[j];if((az>z)!==(bz>z)&&x<(bx-ax)*(z-az)/(bz-az)+ax)inside=!inside;}return inside;};
// The building's footprint squared up along its longest side, because mapped outlines carry small kinks.
export function footprint(poly){let best=0,u=[1,0];poly.forEach((p,i)=>{const q=poly[(i+1)%poly.length],d=Math.hypot(q[0]-p[0],q[1]-p[1]);if(d>best){best=d;u=[(q[0]-p[0])/d,(q[1]-p[1])/d];}});const v=[-u[1],u[0]],along=poly.map(p=>p[0]*u[0]+p[1]*u[1]),across=poly.map(p=>p[0]*v[0]+p[1]*v[1]),at=(a,b)=>[u[0]*a+v[0]*b,u[1]*a+v[1]*b],a0=Math.min(...along),a1=Math.max(...along),b0=Math.min(...across),b1=Math.max(...across);return {corners:[at(a0,b0),at(a1,b0),at(a1,b1),at(a0,b1)],at,a0,a1,b0,b1,u,v};}
export function buildFort(fort){const m=new Mesh(),{ring,gateEdge,corners}=fortPlan(fort),[cx,cz]=fort.center,g=fort.ground,base=g-1.6,pt=(p,y)=>[p[0]-cx,y,p[1]-cz];
 const lit=(a,b)=>{const dx=b[0]-a[0],dz=b[1]-a[1],n=Math.hypot(dx,dz)||1;return .8+.13*(dx/n)-.09*(dz/n);};
 const wall=(a,b,y0,y1,c)=>m.quad(pt(a,y0),pt(b,y0),pt(b,y1),pt(a,y1),c,lit(a,b));
 const flat=(poly,y,c)=>{const mid=poly.reduce((s,p)=>[s[0]+p[0]/poly.length,s[1]+p[1]/poly.length],[0,0]);poly.forEach((p,i)=>{const q=poly[(i+1)%poly.length];m.quad(pt(mid,y),pt(p,y),pt(q,y),pt(q,y),c);});};
 const prism=(poly,y0,y1,side,top)=>{poly.forEach((p,i)=>wall(p,poly[(i+1)%poly.length],y0,y1,side));flat(poly,y1,top);};
 const strip=(a,b,w,y0,y1,side,top)=>{const d=Math.hypot(b[0]-a[0],b[1]-a[1])||1,n=[-(b[1]-a[1])/d*w/2,(b[0]-a[0])/d*w/2];prism([[a[0]+n[0],a[1]+n[1]],[b[0]+n[0],b[1]+n[1]],[b[0]-n[0],b[1]-n[1]],[a[0]-n[0],a[1]-n[1]]],y0,y1,side,top);};
 // The rampart: a grass bank up from the parade, a pale gun walk, then grass out to the brick wall. The gate passage cuts through it.
 const [ga,gb]=fort.curtains[gateEdge],gateAt=Math.hypot(fort.gate[0]-ga[0],fort.gate[1]-ga[1])/Math.hypot(gb[0]-ga[0],gb[1]-ga[1]),gapAt=.08;
 const band=(t1,y1,t2,y2,c)=>{const a=ring(t1),b=ring(t2);corners.forEach((_,i)=>{const j=(i+1)%corners.length,span=(f0,f1)=>m.quad(pt(lerp(a[i],a[j],f0),y1),pt(lerp(a[i],a[j],f1),y1),pt(lerp(b[i],b[j],f1),y2),pt(lerp(b[i],b[j],f0),y2),c,y1===y2?1:.9);if(i===gateEdge){span(0,gateAt-gapAt);span(gateAt+gapAt,1);}else span(0,1);});};
 band(RAMPART_TOE,g,.77,g+RAMPART,BANK);band(.77,g+RAMPART,.85,g+RAMPART,WALK);band(.85,g+RAMPART,.98,g+RAMPART,GRASS);
 const inner=ring(RAMPART_TOE),outer=ring(.98),j=(gateEdge+1)%corners.length;for(const f of [gateAt-gapAt,gateAt+gapAt])m.quad(pt(lerp(inner[gateEdge],inner[j],f),g),pt(lerp(outer[gateEdge],outer[j],f),g),pt(lerp(outer[gateEdge],outer[j],f),g+RAMPART),pt(lerp(inner[gateEdge],inner[j],f),g+RAMPART),BRICK,.8);
 // Curtain walls follow the mapped line, with rows of gun loops on the outer face, and open at the gate under a lintel.
 const hollow=(a,b)=>{const d=Math.hypot(b[0]-a[0],b[1]-a[1])||1,out=[(b[1]-a[1])/d,-(b[0]-a[0])/d],toCenter=(fort.center[0]-a[0])*out[0]+(fort.center[1]-a[1])*out[1],side=toCenter>0?-1:1;strip(a,b,.42,base,g+WALL,BRICK,BRICK_TOP);for(let s=.7;s<d-.4;s+=1.05){const mid=lerp(a,b,s/d),off=[out[0]*side*.23,out[1]*side*.23],l=[mid[0]+off[0]-(b[0]-a[0])/d*.09,mid[1]+off[1]-(b[1]-a[1])/d*.09],r=[mid[0]+off[0]+(b[0]-a[0])/d*.09,mid[1]+off[1]+(b[1]-a[1])/d*.09];m.quad(pt(l,g+.9),pt(r,g+.9),pt(r,g+1.35),pt(l,g+1.35),SLIT);}};
 fort.curtains.forEach(([a,b],i)=>{if(i!==gateEdge)return hollow(a,b);const len=Math.hypot(b[0]-a[0],b[1]-a[1]),h=.85/len;hollow(a,lerp(a,b,gateAt-h));hollow(lerp(a,b,gateAt+h),b);strip(lerp(a,b,gateAt-h),lerp(a,b,gateAt+h),.42,g+1.75,g+WALL,BRICK,BRICK_TOP);});
 // Bastions stand a little taller at the corners. The one nearest the water is grass-topped, as in the aerial photographs.
 fort.bastions.forEach((b,i)=>{const mid=b.reduce((s,p)=>[s[0]+p[0]/b.length,s[1]+p[1]/b.length],[0,0]),green=i===fort.greenBastion;prism(b,base,g+BASTION,BRICK,green?GRASS:STONE);flat(b.map(p=>lerp(mid,p,.5)),g+BASTION+.02,green?BANK:[136,128,112]);});
 // The drawbridge and the paved walkway in, which passes between the Guard Rooms and the Prison.
 strip(fort.bridge[0],fort.bridge[1],.9,g+.1,g+.32,WOOD,WOOD);strip(fort.gate,lerp(fort.gate,fort.center,.62),1.25,g,g+.05,WALK,WALK);
 for(const b of fort.buildings){const f=footprint(b.poly),tall=/Barracks|Storehouse/.test(b.name),h=tall?2.3:1.15,roof=tall?.85:.55,rim=.08,c=f.corners,ax=f.at(f.a0+Math.min(f.a1-f.a0,f.b1-f.b0)/2,(f.b0+f.b1)/2),bx=f.at(f.a1-Math.min(f.a1-f.a0,f.b1-f.b0)/2,(f.b0+f.b1)/2);c.forEach((p,i)=>wall(p,c[(i+1)%4],g,g+h,BRICK));
  const eave=[f.at(f.a0-rim,f.b0-rim),f.at(f.a1+rim,f.b0-rim),f.at(f.a1+rim,f.b1+rim),f.at(f.a0-rim,f.b1+rim)],y=g+h,top=y+roof;m.quad(pt(eave[0],y),pt(eave[1],y),pt(bx,top),pt(ax,top),ROOF,.82);m.quad(pt(eave[2],y),pt(eave[3],y),pt(ax,top),pt(bx,top),ROOF,1);m.quad(pt(eave[1],y),pt(eave[2],y),pt(bx,top),pt(bx,top),ROOF,.92);m.quad(pt(eave[3],y),pt(eave[0],y),pt(ax,top),pt(ax,top),ROOF,.74);
  if(tall){for(const row of [.55,1.45])for(const edge of [[f.b0-.01,-1],[f.b1+.01,1]])for(let a=f.a0+.28;a<f.a1-.15;a+=.45){const p=f.at(a,edge[0]),q=f.at(a+.17,edge[0]);m.quad(pt(p,g+row),pt(q,g+row),pt(q,g+row+.42),pt(p,g+row+.42),[64,62,66],1);}for(const a of [f.a0+.22,f.a1-.22])strip(f.at(a,f.b0+.2),f.at(a,f.b1-.2),.16,y,top+.28,BRICK,BRICK_TOP);}}
 for(const r of fort.ruins)prism(r,g,g+.2,STONE,[166,160,142]);
 // Cannons sit on round pale platforms, pointing outward from the center of the fort.
 const toe=ring(RAMPART_TOE+.03);for(const c of fort.cannons){const y=insidePolygon(toe,c[0],c[1])?g:g+RAMPART,out=lerp(c,[c[0]+c[0]-cx,c[1]+c[1]-cz],.8/Math.hypot(c[0]-cx,c[1]-cz));flat(Array.from({length:10},(_,i)=>[c[0]+Math.cos(i*.628)*.62,c[1]+Math.sin(i*.628)*.62]),y+.03,[202,196,178]);strip(c,lerp(c,out,.55),.2,y+.05,y+.22,[60,46,36],[60,46,36]);strip(lerp(c,out,-.15),out,.1,y+.24,y+.36,IRON,IRON);}
 const f=fort.flag;strip([f[0]-.05,f[1]],[f[0]+.05,f[1]],.1,g,g+8,[236,234,226],[236,234,226]);[[0,[182,50,48]],[.28,[244,242,236]],[.56,[182,50,48]]].forEach(([y,c])=>m.quad(pt([f[0]+.06,f[1]],g+6.9+y),pt([f[0]+2,f[1]],g+6.9+y),pt([f[0]+2,f[1]],g+7.18+y),pt([f[0]+.06,f[1]],g+7.18+y),c));for(const side of [-.01,.01])m.quad(pt([f[0]+.06,f[1]+side],g+7.34),pt([f[0]+.9,f[1]+side],g+7.34),pt([f[0]+.9,f[1]+side],g+7.74),pt([f[0]+.06,f[1]+side],g+7.74),[48,70,120]);
 return m.finish();}
