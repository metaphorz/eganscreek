// Adds the species on Maia McGuire's "Salt Marsh Plants of NE Florida" (Florida Sea Grant Extension Program).
// The sheet's photographs were extracted to public/assets/plants/ and are credited to the author; each species also
// gets iNaturalist area counts and openly licensed reference photos from its Wikipedia page, as in add-sign-species.mjs.
import {readFile,writeFile} from 'node:fs/promises';
const sheet=[
 ['smooth-cordgrass','Smooth Cordgrass','Spartina alterniflora'],
 ['saltmeadow-cordgrass','Saltmeadow Cordgrass','Spartina patens'],
 ['black-needle-rush','Black Needle Rush','Juncus roemerianus'],
 ['glasswort','Glasswort','Salicornia perennis'],
 ['saltwort','Saltwort','Batis maritima'],
 ['sea-purslane','Sea Purslane','Sesuvium portulacastrum'],
 ['sea-blite','Sea Blite','Suaeda linearis'],
 ['black-mangrove','Black Mangrove','Avicennia germinans'],
 ['white-mangrove','White Mangrove','Laguncularia racemosa'],
 ['marsh-elder','Marsh Elder','Iva frutescens'],
 ['sea-oxeye','Sea Oxeye','Borrichia frutescens'],
 ['sea-lavender','Sea Lavender','Limonium carolinianum'],
 ['adams-needle','Adam’s Needle','Yucca filamentosa'],
 ['spanish-bayonet','Spanish Bayonet','Yucca aloifolia'],
 ['prickly-pear-cactus','Prickly Pear Cactus','Opuntia stricta','47902'],
];
const data=JSON.parse(await readFile('src/data/animals.json','utf8'));
const headers={'User-Agent':'EgansCreekAtlas/1.0 (educational photo attribution)'};
async function json(url){for(let i=0;i<5;i++){await new Promise(r=>setTimeout(r,1200+i*4000));try{const r=await fetch(url,{headers,signal:AbortSignal.timeout(25000)});if(r.ok)return r.json();if(r.status!==429)throw Error('HTTP '+r.status);}catch(e){if(i===4)throw e;}}throw Error('Rate limited');}
const clean=s=>String(s||'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
const [[swlat,swlng],[nelat,nelng]]=data.bounds;
const mcguire=(slug,name)=>({src:`/assets/plants/mcguire-${slug}.jpg`,author:'Maia McGuire',publication:'Salt Marsh Plants of NE Florida',publisher:'Florida Sea Grant Extension Program',caption:`${name}, from Salt Marsh Plants of NE Florida`});
for(const [slug,name,scientific,existingId] of sheet){
 if(existingId){const s=data.species.find(s=>s.id===existingId);s.guide='saltmarsh';if(!s.photos.some(p=>p.publication))s.photos.splice(1,0,mcguire(slug,name));console.log('ON SHEET, ALREADY PRESENT',s.name);continue;}
 const taxon=(await json('https://api.inaturalist.org/v1/taxa?'+new URLSearchParams({q:scientific,per_page:'10'}))).results.find(t=>t.name===scientific||t.matched_term===scientific);
 if(!taxon){console.log('NO TAXON',scientific);continue;}
 const id=String(taxon.id);
 const existing=data.species.find(s=>s.id===id);if(existing){existing.guide='saltmarsh';console.log('ON SHEET, ALREADY PRESENT',name);continue;}
 const count=(await json('https://api.inaturalist.org/v1/observations?'+new URLSearchParams({taxon_id:id,swlat,swlng,nelat,nelng,quality_grade:'research',captive:'false',per_page:'0'}))).total_results;
 const q=new URLSearchParams({action:'query',titles:scientific,redirects:'1',prop:'images|pageimages',imlimit:'100',piprop:'name',format:'json'});
 const page=Object.values((await json('https://en.wikipedia.org/w/api.php?'+q)).query.pages)[0];
 const candidates=[page.pageimage&&'File:'+page.pageimage,...(page.images||[]).map(i=>i.title)].filter(Boolean).map(s=>s.replaceAll('_',' '));
 const genus=scientific.split(' ')[0].toLowerCase(),words=[scientific,taxon.name,name,scientific.split(' ')[1]].map(s=>s.toLowerCase());
 const files=[...new Set(candidates)].filter((f,i)=>/\.(jpg|jpeg|png)$/i.test(f)&&!/(map|range|distribution|museum|drawing|stamp|fossil|diagram|specimen|plate|herbarium|illustration)/i.test(f)&&(i===0||words.some(w=>f.toLowerCase().includes(w))||f.toLowerCase().includes(genus)));
 const photos=[mcguire(slug,name)];
 for(const file of files){if(photos.length===4)break;
  const q=new URLSearchParams({action:'query',titles:file,prop:'imageinfo',iiprop:'url|extmetadata',iiurlwidth:'960',format:'json'});
  const image=Object.values((await json('https://commons.wikimedia.org/w/api.php?'+q)).query.pages)[0]?.imageinfo?.[0];if(!image||photos.some(p=>p.original===image.url))continue;
  const m=image.extmetadata||{},license=clean(m.LicenseShortName?.value);if(!/^(CC BY|CC0|Public domain)/i.test(license))continue;
  const r=await fetch(image.thumburl||image.url,{headers});if(!r.ok)continue;
  const ext=r.headers.get('content-type')?.includes('png')?'png':'jpg',src=`/assets/animals/${id}-commons-${photos.length}.${ext}`;
  await writeFile('public'+src,Buffer.from(await r.arrayBuffer()));
  photos.push({src,author:clean(m.Artist?.value)||'Unspecified author; see source',license,licenseUrl:(m.LicenseUrl?.value||'https://commons.wikimedia.org/wiki/Commons:Public_domain').replace('http://creativecommons.org/','https://creativecommons.org/'),source:image.descriptionurl,original:image.url,caption:clean(m.ImageDescription?.value).slice(0,250)||name});
 }
 data.species.push({id,name,scientific,...(taxon.name!==scientific?{accepted:taxon.name}:{}),group:'plants',count,source:`https://www.inaturalist.org/taxa/${id}`,guide:'saltmarsh',photos});
 await writeFile('src/data/animals.json',JSON.stringify(data,null,2)+'\n');console.log(name,id,taxon.name,count,photos.length);
}
await writeFile('src/data/animals.json',JSON.stringify(data,null,2)+'\n');
