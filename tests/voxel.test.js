import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MAT,COLORS,HABITATS} from '../voxel/materials.js';
import {BRIDGE_TOP,CHUNK,UNITS,buildChunk,hash,makeWorld} from '../voxel/world.js';
import {FLOCK,flightAt} from '../voxel/birds.js';
import {buildFort,fortPlan} from '../voxel/fort.js';
const meta=JSON.parse(readFileSync('voxel/voxel-world.json','utf8')),world=makeWorld(meta,new Uint8Array(readFileSync('voxel/voxel-world.bin')));
const count=m=>{let n=0;for(let z=0;z<world.rows;z++)for(let x=0;x<world.cols;x++)if(world.materialAt(x,z)===m)n++;return n;};

test('every material has a color and a habitat name',()=>{const size=Object.keys(MAT).length;assert.equal(COLORS.length,size);assert.equal(HABITATS.length,size);});

test('the float route stays on the creek from its southern end to its northern mouth',()=>{
 assert.ok(world.routeLength>500);const south=world.routePoint(0),north=world.routePoint(world.routeLength);assert.ok(south[1]>north[1]+400);
 for(let d=0;d<=world.routeLength;d+=1){const [x,z]=world.routePoint(d),m=world.materialAt(Math.floor(x),Math.floor(z));assert.ok(world.isWater(m),`dry at ${d}: ${HABITATS[m]}`);}
});

test('the creek sits below its surroundings, as the elevation data shows',()=>{
 assert.ok(count(MAT.saltmarsh)>10000);assert.ok(count(MAT.freshwater)>3000);
 const heights=m=>{const list=[];for(let z=0;z<world.rows;z++)for(let x=0;x<world.cols;x++)if(world.materialAt(x,z)===m)list.push(world.heightAt(x,z));return list.sort((a,b)=>a-b)[list.length>>1];};
 assert.ok(heights(MAT.creek)<0);assert.ok(heights(MAT.saltmarsh)<=1);assert.ok(heights(MAT.neighborhood)>=3);
});

test('salt marsh lies north of Jasmine Street and freshwater wetland south of it',()=>{
 const jasmine=meta.stops.find(s=>s.id==='jasmine').at[1];let north=0,south=0;for(let z=0;z<world.rows;z++)for(let x=250;x<360;x++){const m=world.materialAt(x,z);if(m===MAT.saltmarsh&&z<jasmine)north++;if(m===MAT.freshwater&&z>jasmine)south++;}assert.ok(north>5000);assert.ok(south>3000);
});

test('open ocean past the beach is deep water with no stray land from elevation noise',()=>{
 for(let z=0;z<world.rows;z++)for(let x=480;x<world.cols;x++){assert.equal(world.materialAt(x,z),MAT.water,`${x},${z}`);assert.equal(world.heightAt(x,z),-3,`${x},${z}`);}
});

test('the model takes in the northern tip of the island, so land never meets its north edge',()=>{
 for(let x=120;x<world.cols;x++)assert.equal(world.materialAt(x,0),MAT.water,`land at ${x},0`);
});

test('Fort Clinch follows its mapped plan, with five walls, five bastions, and its named buildings',()=>{
 const {fort}=meta;assert.equal(fort.curtains.length,5);assert.equal(fort.bastions.length,5);const names=fort.buildings.map(b=>b.name);for(const n of ['Guard Rooms','Prison',"Enlisted Men's Barracks",'Storehouse/Dispensary'])assert.ok(names.includes(n),n);assert.ok(fort.cannons.length>=8);assert.ok(fort.ruins.length>=2);
 const mesh=buildFort(fort);assert.ok(mesh.quads>400);assert.ok(mesh.positions.every(Number.isFinite));assert.ok(Math.max(...mesh.positions)<=20*UNITS+8*UNITS);assert.equal(world.materialAt(Math.floor(fort.flag[0]),Math.floor(fort.flag[1])),MAT.fortyard);
});

test('the fort is entered over the Draw Bridge, between the Guard Rooms and the Prison',()=>{
 const {fort}=meta,{gate,center}=fort,dx=center[0]-gate[0],dz=center[1]-gate[1],side=name=>{const b=fort.buildings.find(b=>b.name===name).poly,m=b.reduce((s,p)=>[s[0]+p[0]/b.length,s[1]+p[1]/b.length],[0,0]);return dx*(m[1]-gate[1])-dz*(m[0]-gate[0]);};
 assert.ok(side('Guard Rooms')*side('Prison')<0,'the two buildings should stand on either side of the walkway');
 // The fort's start lines up with the gate, so walking straight ahead goes in through it.
 const stop=meta.stops.find(s=>s.id==='fort');for(let t=0;t<=1;t+=.02){const x=stop.at[0]+(stop.facing[0]-stop.at[0])*t*.8,z=stop.at[1]+(stop.facing[1]-stop.at[1])*t*.8;assert.ok(world.walkHeight(Math.floor(x),Math.floor(z))<=fort.ground+1,`blocked at ${x},${z}`);}
 // Walk in from outside the bridge to the flagpole without climbing a wall.
 const [ox,oz]=fort.bridge[0].map(Math.floor),goal=fort.flag.map(Math.floor).join(),seen=new Set([`${ox},${oz}`]),queue=[[ox,oz]];while(queue.length&&!seen.has(goal)){const [x,z]=queue.shift();for(const [nx,nz] of [[x+1,z],[x-1,z],[x,z+1],[x,z-1]]){const k=`${nx},${nz}`;if(!seen.has(k)&&Math.hypot(nx-center[0],nz-center[1])<16&&world.walkHeight(nx,nz)-world.walkHeight(x,z)<=2){seen.add(k);queue.push([nx,nz]);}}}assert.ok(seen.has(goal),'a walker should reach the parade ground through the gate');
 // The other four walls stop a walker at the rampart.
 const wallCells=fort.curtains.flatMap(([a,b],i)=>i===fortPlan(fort).gateEdge?[]:[[a[0]*.5+b[0]*.5+(center[0]-a[0]*.5-b[0]*.5)*.1,a[1]*.5+b[1]*.5+(center[1]-a[1]*.5-b[1]*.5)*.1]]);assert.equal(wallCells.length,4);for(const [x,z] of wallCells)assert.ok(world.walkHeight(Math.floor(x),Math.floor(z))-fort.ground>=3,`${x},${z} should block`);
});

test('both walks start on a path that heads south and stays walkable',()=>{
 assert.deepEqual(meta.walks.map(w=>w.id),['atlantic','jasmine']);
 for(const w of meta.walks){assert.equal(world.materialAt(Math.floor(w.at[0]),Math.floor(w.at[1])),MAT.trail,w.id);assert.ok(w.path.at(-1)[1]>w.at[1]+80,`${w.id} should end well south of its start`);
  let on=0,all=0;for(let i=1;i<w.path.length;i++){const [ax,az]=w.path[i-1],[bx,bz]=w.path[i],n=Math.ceil(Math.hypot(bx-ax,bz-az)*2)||1;for(let s=0;s<=n;s++){all++;const m=world.materialAt(Math.floor(ax+(bx-ax)*s/n),Math.floor(az+(bz-az)*s/n));if(m===MAT.trail||m===MAT.bridge||m===MAT.road)on++;}}assert.ok(on/all>.9,`${w.id} is on the path for ${on}/${all}`);}
});

test('the Greenway is mostly cordgrass with a one-block creek beside the path',()=>{
 const {at}=meta.walks[0],jasmine=meta.stops.find(s=>s.id==='jasmine').at[1];let reed=0,open=0;for(let z=Math.ceil(at[1])+10;z<jasmine-5;z++)for(let x=270;x<335;x++){const m=world.materialAt(x,z);if(m===MAT.freshwater)reed++;if(m===MAT.creek||m===MAT.water)open++;}assert.ok(reed>open*6,`${reed} cordgrass, ${open} open water`);
});

const alongPath=(path,visit)=>{for(let i=1;i<path.length;i++){const [ax,az]=path[i-1],[bx,bz]=path[i],len=Math.hypot(bx-ax,bz-az)||1,steps=Math.ceil(len*2);for(let s=0;s<=steps;s++)visit(ax+(bx-ax)*s/steps,az+(bz-az)*s/steps,(bx-ax)/len,(bz-az)/len);}};

test('walking south on either path, the creek is just to the right',()=>{
 const jasmineZ=meta.stops.find(s=>s.id==='jasmine').at[1];
 for(const w of meta.walks){let hugged=0,all=0;alongPath(w.path,(x,z,dx,dz)=>{if(w.id==='atlantic'&&z>jasmineZ-3)return;all++;let found=false;for(const by of [.8,1.2,1.6,2,2.4,2.8])if(world.materialAt(Math.floor(x-dz*by),Math.floor(z+dx*by))===MAT.creek||world.materialAt(Math.floor(x-dz*by),Math.floor(z+dx*by))===MAT.bridge)found=true;if(found)hugged++;});assert.ok(all>100);assert.ok(hugged/all>.92,`${w.id}: creek on the right for ${hugged}/${all}`);
  let left=0;alongPath(w.path,(x,z,dx,dz)=>{if(world.materialAt(Math.floor(x+dz*1.6),Math.floor(z-dx*1.6))===MAT.creek)left++;});assert.ok(left<all*.1,`${w.id}: creek on the left for ${left}`);}
});

test('one walk connects Atlantic Avenue to the path south of Jasmine Street without leaving path or road',()=>{
 const [north,south]=meta.walks,walkable=m=>m===MAT.trail||m===MAT.road,start=[Math.floor(north.at[0]),Math.floor(north.at[1])],goal=`${Math.floor(south.at[0])},${Math.floor(south.at[1])}`,seen=new Set([start.join()]),queue=[start];
 while(queue.length&&!seen.has(goal)){const [x,z]=queue.shift();for(const [nx,nz] of [[x+1,z],[x-1,z],[x,z+1],[x,z-1],[x+1,z+1],[x-1,z-1],[x+1,z-1],[x-1,z+1]]){const k=`${nx},${nz}`;if(!seen.has(k)&&walkable(world.materialAt(nx,nz))){seen.add(k);queue.push([nx,nz]);}}}
 assert.ok(seen.has(goal),'the two paths should join along Jasmine Street, with no creek to wade or bridge to climb');
});

test('the main path has no bridge humps of its own',()=>{for(const w of meta.walks){let humps=0;alongPath(w.path,(x,z)=>{if(world.materialAt(Math.floor(x),Math.floor(z))===MAT.bridge)humps++;});assert.ok(humps===0,`${w.id} has ${humps} samples on a bridge`);}});

test('flying birds are herons and egrets that circle over the wetland',()=>{
 assert.ok(FLOCK.some(b=>b.kind==='heron'));assert.ok(FLOCK.some(b=>b.kind==='egret'));const south=meta.stops.find(s=>s.id==='south').at[1],atlantic=meta.stops.find(s=>s.id==='atlantic').at[1];
 for(const b of FLOCK){const center=world.routePoint(world.routeLength*b.along);assert.ok(center[1]<south+1&&center[1]>atlantic-1,`${b.kind} loop center ${center}`);for(let t=0;t<120;t+=7){const p=flightAt(b,t,center);assert.ok(p.y>4);assert.ok(Math.hypot(p.x-center[0],p.z-center[1])<=b.radius+.01);}}
});

test('walkers cross bridges on the deck and wade at the water surface',()=>{
 let bridges=0;for(let z=0;z<world.rows;z++)for(let x=0;x<world.cols;x++)if(world.materialAt(x,z)===MAT.bridge){bridges++;assert.equal(world.walkHeight(x,z),BRIDGE_TOP);}assert.ok(bridges>0,'the roads over the creek should be bridges');
 const [x,z]=world.routePoint(50);if(world.materialAt(Math.floor(x),Math.floor(z))===MAT.creek)assert.equal(world.walkHeight(Math.floor(x),Math.floor(z)),0);
});

test('stops resolve to open ground rather than a roof',()=>{for(const s of meta.stops){const [x,z]=world.openGround(s.at[0],s.at[1]);assert.notEqual(world.materialAt(Math.floor(x),Math.floor(z)),MAT.building,s.id);}});

test('meshing is repeatable and stays within 16-bit positions',()=>{
 const a=buildChunk(world,8,12),b=buildChunk(world,8,12);assert.deepEqual(a.terrain.positions,b.terrain.positions);assert.equal(a.terrain.indices.length,a.terrain.quads*6);assert.equal(a.terrain.positions.length,a.terrain.quads*12);assert.equal(a.terrain.colors.length,a.terrain.quads*12);
 assert.ok(Math.max(...a.terrain.positions)<=(CHUNK+30)*UNITS);assert.equal(hash(4,9,1),hash(4,9,1));assert.notEqual(hash(4,9,1),hash(9,4,1));
});

test('a mostly open-ocean chunk merges its water into few quads',()=>{const {water}=buildChunk(world,15,8);assert.ok(water);assert.ok(water.quads<=CHUNK*4);});
