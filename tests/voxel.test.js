import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MAT,COLORS,HABITATS} from '../voxel/materials.js';
import {BRIDGE_TOP,CHUNK,UNITS,buildChunk,hash,makeWorld} from '../voxel/world.js';
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
