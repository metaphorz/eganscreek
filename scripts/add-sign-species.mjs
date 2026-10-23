// Adds species listed on the Greenway's butterfly and snake signs (photographed 2026-10-23).
// Taxa and area counts come from iNaturalist; reference photos from each species' Wikipedia page.
// Candidates are written for visual review; prune them in src/data/animals.json before publishing.
import {readFile,writeFile} from 'node:fs/promises';
const sign=[
 ['butterflies','invertebrates','Great Southern White','Ascia monuste'],
 ['butterflies','invertebrates','Palamedes Swallowtail','Papilio palamedes'],
 ['butterflies','invertebrates','Monarch','Danaus plexippus'],
 ['butterflies','invertebrates','Common Buckeye','Junonia coenia'],
 ['butterflies','invertebrates','Long-tailed Skipper','Urbanus proteus'],
 ['butterflies','invertebrates','Whirlabout Skipper','Polites vibex'],
 ['butterflies','invertebrates','Viceroy','Limenitis archippus'],
 ['butterflies','invertebrates','Little Yellow','Pyrisitia lisa'],
 ['butterflies','invertebrates','Eastern Tiger Swallowtail','Papilio glaucus'],
 ['butterflies','invertebrates','Red Admiral','Vanessa atalanta'],
 ['snakes','reptiles','Eastern Diamondback Rattlesnake','Crotalus adamanteus',true],
 ['snakes','reptiles','Pygmy Rattlesnake','Sistrurus miliarius',true],
 ['snakes','reptiles','Florida Cottonmouth','Agkistrodon conanti',true],
 ['snakes','reptiles','Eastern Coral Snake','Micrurus fulvius',true],
 ['snakes','reptiles','Southern Black Racer','Coluber constrictor'],
 ['snakes','reptiles','Scarlet Kingsnake','Lampropeltis elapsoides'],
 ['snakes','reptiles','Yellow Rat Snake','Pantherophis alleghaniensis'],
 ['snakes','reptiles','Corn Snake','Pantherophis guttatus'],
 ['snakes','reptiles','Eastern Garter Snake','Thamnophis sirtalis'],
 ['snakes','reptiles','Ribbon Snake','Thamnophis saurita'],
 ['snakes','reptiles','Florida Ringneck Snake','Diadophis punctatus'],
 ['snakes','reptiles','Southern Hog-nosed Snake','Heterodon simus'],
 ['snakes','reptiles','Rough Green Snake','Opheodrys aestivus'],
 ['snakes','reptiles','Eastern Coachwhip','Masticophis flagellum'],
];
const data=JSON.parse(await readFile('src/data/animals.json','utf8'));
const headers={'User-Agent':'EgansCreekAtlas/1.0 (educational photo attribution)'};
async function json(url){for(let i=0;i<5;i++){await new Promise(r=>setTimeout(r,1200+i*4000));try{const r=await fetch(url,{headers,signal:AbortSignal.timeout(25000)});if(r.ok)return r.json();if(r.status!==429)throw Error('HTTP '+r.status);}catch(e){if(i===4)throw e;}}throw Error('Rate limited');}
const clean=s=>String(s||'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
const [[swlat,swlng],[nelat,nelng]]=data.bounds;
for(const [signName,group,name,scientific,venomous] of sign){
 const taxon=(await json('https://api.inaturalist.org/v1/taxa?'+new URLSearchParams({q:scientific,rank:'species,subspecies',per_page:'5'}))).results.find(t=>t.name===scientific||t.matched_term===scientific);
 if(!taxon){console.log('NO TAXON',scientific);continue;}
 const id=String(taxon.id);
 const existing=data.species.find(s=>s.id===id);if(existing){existing.sign=signName;console.log('ON SIGN, ALREADY PRESENT',name);continue;}
 const count=(await json('https://api.inaturalist.org/v1/observations?'+new URLSearchParams({taxon_id:id,swlat,swlng,nelat,nelng,quality_grade:'research',captive:'false',per_page:'0'}))).total_results;
 const q=new URLSearchParams({action:'query',titles:scientific,redirects:'1',prop:'images|pageimages',imlimit:'100',piprop:'name',format:'json'});
 const page=Object.values((await json('https://en.wikipedia.org/w/api.php?'+q)).query.pages)[0];
 const candidates=[page.pageimage&&'File:'+page.pageimage,...(page.images||[]).map(i=>i.title)].filter(Boolean).map(s=>s.replaceAll('_',' '));
 const genus=scientific.split(' ')[0].toLowerCase(),words=[scientific,name,name.replace(/ (Snake|Skipper)$/,''),scientific.split(' ')[1]].map(s=>s.toLowerCase());
 const files=[...new Set(candidates)].filter((f,i)=>/\.(jpg|jpeg|png)$/i.test(f)&&!/(map|range|distribution|egg|museum|skull|skeleton|drawing|stamp|fossil|diagram|cladogram|specimen|plate)/i.test(f)&&(i===0||words.some(w=>f.toLowerCase().includes(w))||f.toLowerCase().includes(genus)));
 const photos=[];
 for(const file of files){if(photos.length===4)break;
  const q=new URLSearchParams({action:'query',titles:file,prop:'imageinfo',iiprop:'url|extmetadata',iiurlwidth:'960',format:'json'});
  const image=Object.values((await json('https://commons.wikimedia.org/w/api.php?'+q)).query.pages)[0]?.imageinfo?.[0];if(!image||photos.some(p=>p.original===image.url))continue;
  const m=image.extmetadata||{},license=clean(m.LicenseShortName?.value);if(!/^(CC BY|CC0|Public domain)/i.test(license))continue;
  const r=await fetch(image.thumburl||image.url,{headers});if(!r.ok)continue;
  const ext=r.headers.get('content-type')?.includes('png')?'png':'jpg',src=`/assets/animals/${id}-commons-${photos.length+1}.${ext}`;
  await writeFile('public'+src,Buffer.from(await r.arrayBuffer()));
  photos.push({src,author:clean(m.Artist?.value)||'Unspecified author; see source',license,licenseUrl:(m.LicenseUrl?.value||'https://commons.wikimedia.org/wiki/Commons:Public_domain').replace('http://creativecommons.org/','https://creativecommons.org/'),source:image.descriptionurl,original:image.url,caption:clean(m.ImageDescription?.value).slice(0,250)||name});
 }
 if(!photos.length){console.log('NO PHOTOS',name);continue;}
 data.species.push({id,name,scientific,group,count,source:`https://www.inaturalist.org/taxa/${id}`,sign:signName,...(venomous?{venomous:true}:{}),photos});
 await writeFile('src/data/animals.json',JSON.stringify(data,null,2)+'\n');console.log(name,id,count,photos.length);
}
