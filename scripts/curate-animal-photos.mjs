import {readFile,writeFile} from 'node:fs/promises';
const data=JSON.parse(await readFile('src/data/animals.json','utf8'));
const headers={'User-Agent':'EgansCreekAtlas/1.0 (educational photo attribution)'};
async function json(url){for(let i=0;i<5;i++){await new Promise(r=>setTimeout(r,3000+i*5000));try{const r=await fetch(url,{headers,signal:AbortSignal.timeout(25000)});if(r.ok)return r.json();if(r.status!==429)throw Error('HTTP '+r.status);}catch(e){if(i===4)throw e;}}throw Error('Rate limited');}
const clean=s=>String(s||'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
for(const animal of data.species){
 if(animal.photos.every(p=>p.source.includes('commons.wikimedia.org')))continue;
 const q=new URLSearchParams({action:'query',titles:animal.scientific,redirects:'1',prop:'images|pageimages',imlimit:'100',piprop:'name',format:'json'});
 const page=Object.values((await json('https://en.wikipedia.org/w/api.php?'+q)).query.pages)[0];
 const candidates=[page.pageimage&&'File:'+page.pageimage,...(page.images||[]).map(i=>i.title)].filter(Boolean).map(s=>s.replaceAll('_',' '));
 const words=[animal.scientific,animal.name,animal.name.replace(/^Common /,''),...(animal.id==='555974'?['Uca minax']:[])].map(s=>s.toLowerCase());
 const files=[...new Set(candidates)].filter((f,i)=>/\.(jpg|jpeg|png)$/i.test(f)&&!/(map|range|distribution|egg|museum|skull|skeleton|drawing|stamp|fossil|diagram|cladogram)/i.test(f)&&(i===0||words.some(w=>f.toLowerCase().includes(w))));
 const photos=[];
 for(const file of files){if(photos.length===2)break;
  const q=new URLSearchParams({action:'query',titles:file,prop:'imageinfo',iiprop:'url|extmetadata',iiurlwidth:'960',format:'json'});
  const image=Object.values((await json('https://commons.wikimedia.org/w/api.php?'+q)).query.pages)[0]?.imageinfo?.[0];if(!image||photos.some(p=>p.original===image.url))continue;
  const m=image.extmetadata||{},license=clean(m.LicenseShortName?.value);if(!/^(CC BY|CC0|Public domain)/i.test(license))continue;
  const r=await fetch(image.thumburl||image.url,{headers});if(!r.ok)continue;
  const ext=r.headers.get('content-type')?.includes('png')?'png':'jpg',src=`/assets/animals/${animal.id}-commons-${photos.length+1}.${ext}`;
  await writeFile('public'+src,Buffer.from(await r.arrayBuffer()));photos.push({src,author:clean(m.Artist?.value)||(file.includes('Nerodia fasciata CDC')?'John Willson · Savannah River Ecology Laboratory / CDC PHIL':'Unspecified author; see source'),license,licenseUrl:(m.LicenseUrl?.value||'https://commons.wikimedia.org/wiki/Commons:Public_domain').replace('http://creativecommons.org/','https://creativecommons.org/'),source:image.descriptionurl,original:image.url,caption:clean(m.ImageDescription?.value).slice(0,250)||animal.name});
 }
 if(!photos.length){console.log('NO PHOTOS',animal.name);continue;}
 if(photos.length===1)photos.push(animal.photos.find(p=>p.original!==photos[0].original));
 animal.photos=photos;await writeFile('src/data/animals.json',JSON.stringify(data,null,2)+'\n');console.log(animal.name,photos.map(p=>p.source));
}
