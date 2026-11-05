import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MAT,COLORS,HABITATS} from '../voxel/materials.js';
import {BRIDGE_TOP,CHUNK,UNITS,buildChunk,hash,makeWorld} from '../voxel/world.js';
import {FLOCK,flightAt} from '../voxel/birds.js';
const meta=JSON.parse(readFileSync('public/data/voxel-world.json','utf8')),world=makeWorld(meta,new Uint8Array(readFileSync('public/data/voxel-world.bin')));
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

test('Fort Clinch has walls, a parade ground, and a way in at ground level',()=>{
 let walls=0,yard=0;const {center,ground,wallTop}=meta.fort;for(let z=0;z<world.rows;z++)for(let x=0;x<world.cols;x++){const m=world.materialAt(x,z);if(m===MAT.fort)walls++;if(m===MAT.fortyard)yard++;}
 assert.ok(walls>40);assert.ok(yard>100);assert.equal(world.materialAt(Math.floor(center[0]),Math.floor(center[1])),MAT.fortyard);assert.ok(wallTop>ground+2);
 const seen=new Set(),queue=[[Math.floor(center[0]),Math.floor(center[1])]];let escaped=false;while(queue.length&&!escaped){const [x,z]=queue.pop(),k=`${x},${z}`;if(seen.has(k))continue;seen.add(k);if(Math.hypot(x-center[0],z-center[1])>40){escaped=true;break;}for(const [nx,nz] of [[x+1,z],[x-1,z],[x,z+1],[x,z-1]])if(world.walkHeight(nx,nz)-world.walkHeight(x,z)<=2)queue.push([nx,nz]);}
 assert.ok(escaped,'a walker should be able to leave the fort through the gate');
});

test('both walks start on a path that heads south and stays walkable',()=>{
 assert.deepEqual(meta.walks.map(w=>w.id),['atlantic','jasmine']);
 for(const w of meta.walks){assert.equal(world.materialAt(Math.floor(w.at[0]),Math.floor(w.at[1])),MAT.trail,w.id);assert.ok(w.path.at(-1)[1]>w.at[1]+80,`${w.id} should end well south of its start`);
  let on=0,all=0;for(let i=1;i<w.path.length;i++){const [ax,az]=w.path[i-1],[bx,bz]=w.path[i],n=Math.ceil(Math.hypot(bx-ax,bz-az)*2)||1;for(let s=0;s<=n;s++){all++;const m=world.materialAt(Math.floor(ax+(bx-ax)*s/n),Math.floor(az+(bz-az)*s/n));if(m===MAT.trail||m===MAT.bridge||m===MAT.road)on++;}}assert.ok(on/all>.9,`${w.id} is on the path for ${on}/${all}`);}
});

test('the Greenway is mostly cordgrass with a one-block creek beside the path',()=>{
 const {at}=meta.walks[0],jasmine=meta.stops.find(s=>s.id==='jasmine').at[1];let reed=0,open=0;for(let z=Math.ceil(at[1])+10;z<jasmine-5;z++)for(let x=270;x<335;x++){const m=world.materialAt(x,z);if(m===MAT.freshwater)reed++;if(m===MAT.creek||m===MAT.water)open++;}assert.ok(reed>open*6,`${reed} cordgrass, ${open} open water`);
 // The channel leaves for the Atlantic Avenue bridge at the path's side branch, just south of the start.
 const beside=meta.walks[0].path.filter(([,z])=>z>at[1]+16&&z<jasmine-5);assert.ok(beside.length>5);for(const [x,z] of beside){let near=false;for(let dz=-4;dz<=4;dz++)for(let dx=-4;dx<=4;dx++)if(world.isWater(world.materialAt(Math.floor(x)+dx,Math.floor(z)+dz)))near=true;assert.ok(near,`no creek near the path at ${x},${z}`);}
});

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
