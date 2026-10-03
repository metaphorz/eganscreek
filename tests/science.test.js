import test from 'node:test';
import assert from 'node:assert/strict';
import {tideLevel,interpolate,depth,parseNOAA,eastTime,metresToFeet,validateNotebook,csvExport} from '../src/science.js';
import {birds,filterBirds} from '../src/data/birds.js';
import {sources,stages,history} from '../src/data/content.js';
import {readFile} from 'node:fs/promises';

test('curated bird galleries have distinct local photographs and license attribution',async()=>{
 const photos=JSON.parse(await readFile(new URL('../src/data/bird-photos.json',import.meta.url)));
 for(const b of birds){
  const gallery=photos[b.id];assert.ok(gallery.length>=3);assert.equal(new Set(gallery.map(p=>p.original)).size,gallery.length);
  for(const p of gallery){assert.ok(p.author&&p.license&&p.licenseUrl.startsWith('https://'));assert.ok(p.source.startsWith('https://commons.wikimedia.org/wiki/File:'));assert.ok((await readFile(new URL('../public'+p.src,import.meta.url))).length>1000);}
 }
});
test('creek geometry is sourced Egans Creek hydrography in geographic coordinates',async()=>{
 const data=JSON.parse(await readFile(new URL('../src/data/creek.json',import.meta.url)));
 assert.equal(data.features.length,35);assert.ok(data.metadata.source.startsWith('https://hydro.nationalmap.gov/'));
 for(const f of data.features){assert.equal(f.properties.gnis_name,'Egans Creek');assert.equal(f.geometry.type,'LineString');for(const [lon,lat] of f.geometry.coordinates)assert.ok(lon>-81.49&&lon<-81.41&&lat>30.61&&lat<30.72);}
});
test('animal guide includes both anoles and licensed local reference photos',async()=>{
 const data=JSON.parse(await readFile(new URL('../src/data/animals.json',import.meta.url)));
 assert.equal(data.species.length,20);assert.ok(data.species.some(s=>s.scientific==='Anolis sagrei'));assert.ok(data.species.some(s=>s.scientific==='Anolis carolinensis'));
 for(const s of data.species){assert.ok(s.count>0);assert.equal(s.photos.length,2);for(const p of s.photos){assert.ok(p.author&&p.source.startsWith('https://')&&p.license);assert.ok((await readFile(new URL('../public'+p.src,import.meta.url))).length>1000);}}
});
test('wildlife map records preserve attribution, bounded coordinates, dates and accuracy',async()=>{
 const data=JSON.parse(await readFile(new URL('../src/data/animal-observations.json',import.meta.url)));
 assert.ok(data.observations.length>0);assert.equal(new Set(data.observations.map(o=>o.id)).size,data.observations.length);
 for(const o of data.observations){assert.ok(['cc0','cc-by','cc-by-sa'].includes(o.license));assert.ok(o.observer&&o.source.endsWith(String(o.id)));assert.ok(o.accuracy>=0&&o.accuracy<=100);assert.ok(Date.parse(o.date)<=Date.parse(data.retrieved));const [lon,lat]=o.coordinates;assert.ok(lon>=-81.447&&lon<=-81.432&&lat>=30.639&&lat<=30.669);}
});

test('educational cycle has a low, high and returning low at its stated period',()=>{assert.equal(tideLevel(0),0);assert.ok(Math.abs(tideLevel(6.21)-1.83)<1e-9);assert.ok(Math.abs(tideLevel(12.42))<1e-9);assert.ok(Math.abs(metresToFeet(0.3048)-1)<1e-9);});
test('interpolation rejects gaps and never extrapolates',()=>{const points=[{t:0,v:0},{t:360000,v:2},{t:3600000,v:4}];assert.equal(interpolate(points,180000),1);assert.equal(interpolate(points,720000),null);assert.equal(interpolate(points,-1),null);assert.equal(interpolate(points,3600001),null);assert.equal(interpolate(points,3600000),4);});
test('datum mismatch cannot become a claimed depth',()=>{assert.throws(()=>depth({value:2,datum:'MLLW'},{value:.5,datum:'NAVD88'}));assert.equal(depth({value:2,datum:'example'},{value:3,datum:'example'}),0);});
test('NOAA parser rejects errors and omits missing observations, keeping provenance flags',()=>{assert.throws(()=>parseNOAA({error:{message:'No data'}},'predictions'),/No data/);const p=parseNOAA({data:[{t:'2026-10-01 00:06',v:'1.2',q:'p',f:'0,0,0,0'},{t:'2026-10-01 00:00',v:''}]},'water_level');assert.deepEqual(p,[{t:Date.UTC(2026,9,1,0,6),v:1.2,quality:'p',flags:'0,0,0,0'}]);});
test('Eastern time labels distinguish repeated fall-back hours',()=>{assert.match(eastTime(Date.UTC(2026,10,1,5,30)),/1:30.*EDT/);assert.match(eastTime(Date.UTC(2026,10,1,6,30)),/1:30.*EST/);});
test('all twelve sign birds have unique IDs and supporting references',()=>{assert.equal(birds.length,12);assert.equal(new Set(birds.map(b=>b.id)).size,12);for(const b of birds){assert.ok(b.marks&&b.feeding&&b.scientific);assert.ok(b.source.startsWith('https://www.allaboutbirds.org/guide/'));}assert.equal(filterBirds({search:'yellow feet'})[0].id,'snowy');assert.equal(filterBirds({color:'Pink',habitat:'Shallows'})[0].id,'spoonbill');assert.equal(filterBirds({color:'Pink',habitat:'Grassland'}).length,0);});
test('notebook round trip retains text without interpreting HTML or formulas',()=>{const row={id:'test',date:'2026-10-01',species:'snowy',confidence:'Likely',place:'Northern Greenway',notes:'=HYPERLINK("bad")\n<script>alert(1)</script>'};const file={version:1,entries:[row]};assert.deepEqual(validateNotebook(JSON.parse(JSON.stringify(file))),[row]);assert.match(csvExport([row]),/"'=HYPERLINK/);assert.throws(()=>validateNotebook({version:2,entries:[]}),/version 1/);assert.throws(()=>validateNotebook({version:1,entries:[{...row,confidence:'Invented'}]}),/invalid/);});
test('content provenance and point geometry are present',async()=>{for(const h of history)assert.ok(sources[h.source]);assert.equal(stages.length,5);const geo=JSON.parse(await readFile(new URL('../src/data/places.json',import.meta.url)));for(const f of geo.features){assert.equal(f.geometry.type,'Point');assert.ok(f.properties.source&&f.properties.accuracy);const [lon,lat]=f.geometry.coordinates;assert.ok(lon>-82&&lon<-81&&lat>30&&lat<31);}});
