import * as THREE from 'three';
import {publicURL} from '../src/paths.js';
import {COLORS,MAT} from './materials.js';
import {addBirds,moveBirds} from './birds.js';
import {buildFort} from './fort.js';
import {CHUNK,UNITS,buildChunk,makeWorld} from './world.js';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
// Block colors are authored as displayed, so three's linear color conversion is turned off.
THREE.ColorManagement.enabled=false;
const SKY=0xbfdde6,EYE=2.3,FORT_EYE=1,FLOAT_EYE=1.75,DETAIL_RANGE={walk:150,float:150,fly:230},VIEW={walk:300,float:300,fly:1300},CLIMB=2,LABEL_RANGE=120,SIGN_RANGE=45;
const SPEED={walk:9,fly:34,float:9},calm=matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas:$('#scene'),antialias:devicePixelRatio<2,powerPreference:'high-performance'});}
catch{fail('This model needs WebGL, which is not available in this browser.');}
function fail(message){$('#load-status').textContent=message;$('#load-status').insertAdjacentHTML('beforeend',' <a href="../">Return to the atlas</a>.');}
if(renderer)start().catch(e=>{console.error(e);fail('The landscape could not be loaded.');});
async function start(){
 const [meta,bytes]=await Promise.all([fetch(publicURL('data/voxel-world.json')).then(r=>{if(!r.ok)throw Error('world description');return r.json();}),fetch(publicURL('data/voxel-world.bin')).then(r=>{if(!r.ok)throw Error('world grid');return r.arrayBuffer();})]);
 const world=makeWorld(meta,new Uint8Array(bytes));
 renderer.outputColorSpace=THREE.LinearSRGBColorSpace;let pixelRatio=Math.min(devicePixelRatio,1.5);renderer.setPixelRatio(pixelRatio);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(68,1,.1,1500);camera.rotation.order='YXZ';scene.background=new THREE.Color(SKY);scene.fog=new THREE.Fog(SKY,120,VIEW.walk);
 const resize=()=>{renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();};addEventListener('resize',resize);resize();
 const solid=new THREE.MeshBasicMaterial({vertexColors:true}),wet=new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.8,depthWrite:false});
 function toMesh(data,material,cx,cz){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(data.positions,3));g.setAttribute('color',new THREE.BufferAttribute(data.colors,3,true));g.setIndex(new THREE.BufferAttribute(data.indices,1));const m=new THREE.Mesh(g,material);m.scale.setScalar(1/UNITS);m.position.set(cx*CHUNK,0,cz*CHUNK);return m;}
 const details=[],waterGroup=new THREE.Group();scene.add(waterGroup);const jobs=[];for(let cz=0;cz*CHUNK<world.rows;cz++)for(let cx=0;cx*CHUNK<world.cols;cx++)jobs.push([cx,cz]);
 // Chunks are laid in short slices so the page keeps responding, and the bar below reports progress.
 await new Promise(done=>{let next=0;const slice=()=>{const stop=performance.now()+24;while(next<jobs.length&&performance.now()<stop){const [cx,cz]=jobs[next++],{terrain,water,detail}=buildChunk(world,cx,cz);if(terrain)scene.add(toMesh(terrain,solid,cx,cz));if(water)waterGroup.add(toMesh(water,wet,cx,cz));if(detail){const m=toMesh(detail,solid,cx,cz);m.userData.center=[(cx+.5)*CHUNK,(cz+.5)*CHUNK];details.push(m);scene.add(m);}}$('#load-status').textContent=`Laying blocks… ${Math.round(next/jobs.length*100)}%`;if(next<jobs.length)setTimeout(slice);else done();};slice();});
 addSea(scene,world);addClouds(scene,world);const labels=addStops(scene,world),flock=addBirds(scene,world);scene.add(toMesh(buildFort(meta.fort),new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide}),meta.fort.center[0]/CHUNK,meta.fort.center[1]/CHUNK));
 const player={x:0,z:0,y:0,yaw:0,pitch:0,mode:'fly',eased:0};let routeAt=0,paused=false,lookedAt=-1e9,started=false,cardTimer,flySpeed=1;const keys=new Set(),stick={x:0,z:0},rise={v:0};
 const setView=mode=>{scene.fog.near=mode==='fly'?420:110;scene.fog.far=VIEW[mode];};
 function face(dx,dz){player.yaw=Math.atan2(-dx,-dz);}
 function setMode(mode){const was=player.mode;player.mode=mode;if(mode==='float')$('#stop-card').hidden=true;$$('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));$('#float-tools').hidden=mode!=='float';$('#fly-tools').hidden=mode!=='fly';setView(mode);
  if(mode==='float'){routeAt=world.nearestRouteDistance(player.x,player.z);const p=world.routePoint(routeAt);player.x=p[0];player.z=p[1];const n=world.routePoint(routeAt+6);face(n[0]-p[0],n[1]-p[1]);player.pitch=-.04;paused=false;$('#float-pause').textContent='Pause';$('#float-pause').setAttribute('aria-pressed','false');}
  if(mode==='walk'&&was!=='walk'){[player.x,player.z]=world.openGround(player.x,player.z);player.pitch=clamp(player.pitch,-.3,.3);if(was==='fly')player.pitch=-.05;}
  if(mode==='fly'&&was!=='fly'){player.y=Math.max(player.y,70);player.pitch=-.6;}}
 function goTo(stop){let [x,z]=world.openGround(stop.at[0],stop.at[1]);player.x=x;player.z=z;const near=stop.facing||world.routePoint(world.nearestRouteDistance(x,z));if(Math.hypot(near[0]-x,near[1]-z)>1)face(near[0]-x,near[1]-z);if(player.mode==='float')setMode('walk');player.pitch=player.mode==='fly'?-.6:-.05;
  // From the air, back away along the view so the place sits in the middle of the screen.
  if(player.mode==='fly'){player.y=stop.altitude||42;const back=player.y/Math.tan(.6);player.x+=Math.sin(player.yaw)*back;player.z+=Math.cos(player.yaw)*back;}else player.y=world.walkHeight(Math.floor(x),Math.floor(z))+eyeAt(x,z);
  $('#stop-name').textContent=stop.name;$('#stop-text').textContent=stop.text;$('#stop-card').hidden=false;clearTimeout(cardTimer);cardTimer=setTimeout(()=>{$('#stop-card').hidden=true;},9000);$('#stops').open=false;$('#scene').focus();}
 const startWalk=id=>{setMode('walk');goTo(meta.walks.find(w=>w.id===id));};
 $('#stop-list').innerHTML=meta.walks.map(w=>`<button data-walk="${w.id}">${w.label}</button>`).join('')+meta.stops.map(s=>`<button data-stop="${s.id}">${s.name}</button>`).join('');
 $$('[data-stop]').forEach(b=>b.onclick=()=>goTo(meta.stops.find(s=>s.id===b.dataset.stop)));
 $$('#stop-list [data-walk]').forEach(b=>b.onclick=()=>startWalk(b.dataset.walk));
 $$('[data-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));
 $('#float-pause').onclick=()=>{paused=!paused;$('#float-pause').textContent=paused?'Resume':'Pause';$('#float-pause').setAttribute('aria-pressed',String(paused));};
 const about=$('#about');$('#about-open').onclick=()=>about.showModal();$('#about-close').onclick=()=>about.close();about.addEventListener('click',e=>{if(e.target===about)about.close();});
 // The opening view looks up the whole creek from above its southern end.
 const mid=world.routePoint(world.routeLength*.42);player.x=mid[0]+40;player.z=mid[1]+230;player.y=125;player.pitch=-.5;face(mid[0]-player.x,mid[1]-player.z);setMode('fly');
 $('#load-status').hidden=true;$('#intro-actions').hidden=false;
 $$('[data-start]').forEach(b=>b.onclick=()=>{$('#intro').hidden=true;started=true;const mode=b.dataset.start;
  if(mode==='float'){const p=world.routePoint(0);player.x=p[0];player.z=p[1];setMode('float');}
  if(mode==='fly')setMode('fly');$('#scene').focus();});
 $$('#intro [data-walk]').forEach(b=>b.onclick=()=>{$('#intro').hidden=true;started=true;startWalk(b.dataset.walk);});
 addEventListener('keydown',e=>{if(about.open||e.metaKey||e.ctrlKey||e.altKey)return;const k=e.key.length===1?e.key.toLowerCase():e.key;keys.add(k);if(k===' '&&player.mode==='float'&&e.target.tagName!=='BUTTON'){e.preventDefault();$('#float-pause').click();}if(k.startsWith('Arrow')&&e.target.tagName!=='SUMMARY')e.preventDefault();});
 addEventListener('keyup',e=>keys.delete(e.key.length===1?e.key.toLowerCase():e.key));addEventListener('blur',()=>keys.clear());
 // Dragging looks around for both mouse and touch; the stick claims its own pointer separately.
 const canvas=$('#scene'),looks=new Map();
 // In flight the scroll wheel sets the speed: up is faster, down is slower.
 canvas.addEventListener('wheel',e=>{e.preventDefault();if(player.mode==='fly')flySpeed=clamp(flySpeed*Math.exp(-e.deltaY*.0016),.25,12);},{passive:false});
 canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);looks.set(e.pointerId,[e.clientX,e.clientY]);canvas.focus({preventScroll:true});});
 canvas.addEventListener('pointermove',e=>{const last=looks.get(e.pointerId);if(!last)return;player.yaw-=(e.clientX-last[0])*.0042;player.pitch=clamp(player.pitch-(e.clientY-last[1])*.0042,-1.45,1.45);looks.set(e.pointerId,[e.clientX,e.clientY]);lookedAt=performance.now();});
 for(const type of ['pointerup','pointercancel'])canvas.addEventListener(type,e=>looks.delete(e.pointerId));
 const stickEl=$('#stick'),knob=$('#stick-knob');let stickId=null;const moveStick=e=>{const r=stickEl.getBoundingClientRect(),radius=r.width/2,dx=e.clientX-r.left-radius,dy=e.clientY-r.top-radius,d=Math.min(Math.hypot(dx,dy),radius-14)/Math.max(Math.hypot(dx,dy),1);knob.style.transform=`translate(${dx*d}px,${dy*d}px)`;stick.x=clamp(dx/(radius-14),-1,1);stick.z=clamp(dy/(radius-14),-1,1);};
 stickEl.addEventListener('pointerdown',e=>{stickId=e.pointerId;stickEl.setPointerCapture(stickId);moveStick(e);});stickEl.addEventListener('pointermove',e=>{if(e.pointerId===stickId)moveStick(e);});for(const type of ['pointerup','pointercancel'])stickEl.addEventListener(type,e=>{if(e.pointerId!==stickId)return;stickId=null;stick.x=stick.z=0;knob.style.transform='';});
 const hold=(el,v)=>{el.addEventListener('pointerdown',e=>{e.preventDefault();rise.v=v;});for(const type of ['pointerup','pointerleave','pointercancel'])el.addEventListener(type,()=>{rise.v=0;});};hold($('#fly-up'),1);hold($('#fly-down'),-1);
 const drawMap=miniMap(world,(x,z)=>{player.x=x;player.z=z;if(player.mode==='float')setMode('walk');if(player.mode==='walk')[player.x,player.z]=world.openGround(x,z);});
 // The fort is drawn close to true proportion, so inside it the walker's eye drops below the roofs.
 const eyeAt=(x,z)=>world.materialAt(Math.floor(x),Math.floor(z))===MAT.fortyard?FORT_EYE:EYE;
 const canStand=(x,z,feet)=>world.inside(Math.floor(x),Math.floor(z))&&world.walkHeight(Math.floor(x),Math.floor(z))-feet<=CLIMB;
 function move(dt,now){const turn=(keys.has('ArrowLeft')?1:0)-(keys.has('ArrowRight')?1:0);player.yaw+=turn*1.8*dt;if(keys.has('PageUp'))player.pitch=clamp(player.pitch+1.1*dt,-1.45,1.45);if(keys.has('PageDown'))player.pitch=clamp(player.pitch-1.1*dt,-1.45,1.45);
  const forward=((keys.has('w')||keys.has('ArrowUp'))?1:0)-((keys.has('s')||keys.has('ArrowDown'))?1:0)-stick.z,side=(keys.has('d')?1:0)-(keys.has('a')?1:0)+stick.x,boost=keys.has('Shift')?2.6:1,fx=-Math.sin(player.yaw),fz=-Math.cos(player.yaw),rx=-fz,rz=fx,speed=SPEED[player.mode]*boost*dt*(player.mode==='fly'?flySpeed:1);
  if(player.mode==='float'){const direction=forward<-.2?-1:1;if(!paused||Math.abs(forward)>.2){routeAt=clamp(routeAt+direction*speed*(Math.abs(forward)>.2?Math.abs(forward)+.5:1),0,world.routeLength);}const p=world.routePoint(routeAt),n=world.routePoint(routeAt+10*direction);player.x=p[0];player.z=p[1];player.y=FLOAT_EYE;
   if(now-lookedAt>3500&&Math.hypot(n[0]-p[0],n[1]-p[1])>.5){const want=Math.atan2(-(n[0]-p[0]),-(n[1]-p[1]));let d=want-player.yaw;d=Math.atan2(Math.sin(d),Math.cos(d));player.yaw+=d*Math.min(1,dt*1.4);player.pitch+=(-.04-player.pitch)*Math.min(1,dt);}
   $('#float-progress').textContent=routeAt>=world.routeLength?'You reached the mouth':`${Math.round(routeAt/world.routeLength*100)}% to the mouth`;return;}
  const mx=(fx*forward+rx*side)*speed,mz=(fz*forward+rz*side)*speed;
  if(player.mode==='fly'){const pitch=Math.cos(player.pitch);player.x=clamp(player.x+mx*(forward?pitch:1),-120,world.cols+120);player.z=clamp(player.z+mz*(forward?pitch:1),-120,world.rows+120);const climb=rise.v+(keys.has('e')||keys.has(' ')?1:0)-(keys.has('q')?1:0)+(forward?Math.sin(player.pitch)*forward:0);player.y=clamp(player.y+climb*speed,6,380);const ground=world.walkHeight(Math.floor(player.x),Math.floor(player.z));player.y=Math.max(player.y,ground+3);return;}
  const feet=player.y-eyeAt(player.x,player.z);if(canStand(player.x+mx,player.z,feet))player.x+=mx;if(canStand(player.x,player.z+mz,feet))player.z+=mz;const ground=world.walkHeight(Math.floor(player.x),Math.floor(player.z))+eyeAt(player.x,player.z);player.y+=(ground-player.y)*Math.min(1,dt*(ground>player.y?12:7));}
 let lastReadout='',lastDetail=0,frames=0,frameClock=performance.now();
 function readout(){const fx=Math.floor(player.x),fz=Math.floor(player.z),m=world.materialAt(fx,fz),h=world.heightAt(fx,fz),lon=meta.bounds.west+player.x/world.cols*(meta.bounds.east-meta.bounds.west),lat=meta.bounds.north-player.z/world.rows*(meta.bounds.north-meta.bounds.south),wet=world.isWater(m);if(!world.inside(fx,fz))return 'Past the edge of the model';const place=player.mode==='fly'?`Over: ${world.habitatAt(fx,fz)}`:world.habitatAt(fx,fz),level=m===MAT.building||m===MAT.bridge||m===MAT.fort?'':wet?' · At sea level':` · Ground ${h} m`;const pace=player.mode==='fly'&&Math.abs(flySpeed-1)>.04?` · Speed ×${flySpeed<1?flySpeed.toFixed(2):flySpeed.toFixed(1)}`:'';return `${place}${level} · ${lat.toFixed(3)}° N, ${Math.abs(lon).toFixed(3)}° W${pace}`;}
 function frame(now){requestAnimationFrame(frame);const dt=Math.min(.05,(now-(frame.last??now))/1000);frame.last=now;if(started&&!about.open)move(dt,now);
  camera.position.set(player.x,player.y,player.z);camera.rotation.set(player.pitch,player.yaw,0);if(!calm)waterGroup.position.y=Math.sin(now/1400)*.04;moveBirds(flock,now/1000,calm);
  if(now-lastDetail>400){lastDetail=now;const range=DETAIL_RANGE[player.mode];for(const m of details)m.visible=Math.hypot(m.userData.center[0]-player.x,m.userData.center[1]-player.z)<range+CHUNK;for(const l of labels){const near=Math.hypot(l.position.x-player.x,l.position.z-player.z)<(l.userData.sign?SIGN_RANGE:LABEL_RANGE);l.visible=player.mode==='fly'?!l.userData.sign:near;}const text=readout();if(text!==lastReadout){lastReadout=text;$('#readout').textContent=text;}drawMap(player);}
  renderer.render(scene,camera);
  // A slower tablet gives up resolution before it gives up smooth motion.
  frames++;if(now-frameClock>2500){const fps=frames*1000/(now-frameClock);frames=0;frameClock=now;if(fps<26&&pixelRatio>.75){pixelRatio=Math.max(.75,pixelRatio-.25);renderer.setPixelRatio(pixelRatio);resize();}}}
 requestAnimationFrame(frame);
}
// Open water continues past the edge of the model so the horizon reads as sea.
function addSea(scene,world){const material=new THREE.MeshBasicMaterial({color:new THREE.Color(...COLORS[MAT.water].map(v=>v/255))}),far=3000,{cols,rows}=world;
 // The floor under the translucent water, and four strips level with its surface around the outside.
 for(const [x,y,z,w,d] of [[cols/2,-3.2,rows/2,cols+40,rows+40],[-far/2,0,rows/2,far,rows+far*2],[cols+far/2,0,rows/2,far,rows+far*2],[cols/2,0,-far/2,cols,far],[cols/2,0,rows+far/2,cols,far]]){const sea=new THREE.Mesh(new THREE.PlaneGeometry(w,d),material);sea.rotation.x=-Math.PI/2;sea.position.set(x,y,z);scene.add(sea);}}
// Clouds fly high and in small stacks, so they stay above the opening view of the whole creek.
function addClouds(scene,world){const box=new THREE.BoxGeometry(1,1,1),count=48,mesh=new THREE.InstancedMesh(box,new THREE.MeshBasicMaterial({color:0xfafcfa,fog:false}),count*2),m=new THREE.Matrix4();for(let i=0;i<count;i++){const seed=i*7.13,x=(Math.sin(seed)*.5+.5)*world.cols*1.6-world.cols*.3,z=(Math.cos(seed*1.7)*.5+.5)*world.rows*1.5-world.rows*.25,w=18+((i*13)%22),d=12+((i*7)%16),y=175+(i%4)*7;m.makeScale(w,4,d);m.setPosition(x,y,z);mesh.setMatrixAt(i*2,m);m.makeScale(w*.55,4,d*.6);m.setPosition(x+w*.08,y+4,z-d*.06);mesh.setMatrixAt(i*2+1,m);}scene.add(mesh);}
function addStops(scene,world){const labels=[],beam=new THREE.BoxGeometry(.5,1,.5),gold=new THREE.MeshBasicMaterial({color:0xe2a93c});for(const s of [...world.meta.stops,...world.meta.signs]){const tall=s.sign?5:16,ground=Math.max(0,world.walkHeight(Math.floor(s.at[0]),Math.floor(s.at[1]))),post=new THREE.Mesh(beam,gold),spot=s.labelAt||s.at;post.scale.set(s.sign?.4:1,tall,s.sign?.4:1);post.position.set(s.at[0],ground+tall/2,s.at[1]);if(!s.labelAt)scene.add(post);
 const c=document.createElement('canvas');c.width=512;c.height=96;const g=c.getContext('2d');g.font='400 46px Georgia, serif';const w=Math.min(500,g.measureText(s.name).width+40);g.fillStyle='rgba(255,253,247,.94)';g.fillRect((512-w)/2,8,w,80);g.strokeStyle='#355a47';g.lineWidth=3;g.strokeRect((512-w)/2,8,w,80);g.fillStyle='#293f35';g.textAlign='center';g.textBaseline='middle';g.fillText(s.name,256,50);
 const label=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),fog:false,transparent:true,sizeAttenuation:false,depthTest:false}));label.scale.set(.3,.056,1);label.position.set(spot[0],ground+tall+(s.sign?1.2:3),spot[1]);label.renderOrder=2;label.userData.sign=Boolean(s.sign);scene.add(label);labels.push(label);}return labels;}
function miniMap(world,go){const canvas=$('#minimap');canvas.height=Math.round(canvas.width*world.rows/world.cols);const g=canvas.getContext('2d'),base=document.createElement('canvas');base.width=canvas.width;base.height=canvas.height;const b=base.getContext('2d'),img=b.createImageData(base.width,base.height),sx=world.cols/base.width,sz=world.rows/base.height;
 for(let y=0;y<base.height;y++)for(let x=0;x<base.width;x++){const c=COLORS[world.materialAt(Math.floor(x*sx),Math.floor(y*sz))],i=(y*base.width+x)*4;img.data[i]=c[0];img.data[i+1]=c[1];img.data[i+2]=c[2];img.data[i+3]=255;}b.putImageData(img,0,0);
 b.strokeStyle='#7fe6f2';b.lineWidth=2;b.beginPath();world.meta.route.forEach(([x,z],i)=>b[i?'lineTo':'moveTo'](x/sx,z/sz));b.stroke();b.fillStyle='#e2a93c';for(const s of world.meta.stops){b.fillRect(s.at[0]/sx-3,s.at[1]/sz-3,6,6);}
 canvas.addEventListener('pointerdown',e=>{const r=canvas.getBoundingClientRect();go((e.clientX-r.left)/r.width*world.cols,(e.clientY-r.top)/r.height*world.rows);});
 return p=>{g.drawImage(base,0,0);const x=p.x/sx,y=p.z/sz;g.save();g.translate(x,y);g.rotate(-p.yaw);g.fillStyle='#fff';g.strokeStyle='#16302a';g.lineWidth=2;g.beginPath();g.moveTo(0,-11);g.lineTo(7,8);g.lineTo(0,4);g.lineTo(-7,8);g.closePath();g.fill();g.stroke();g.restore();};}
