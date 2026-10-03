import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {birds} from '../src/data/birds.js';
const headers={'User-Agent':'EgansCreekAtlas/1.0 (educational natural history photo attribution)'};
async function json(url){for(let attempt=0;attempt<5;attempt++){await new Promise(r=>setTimeout(r,1500+attempt*5000));const r=await fetch(url,{headers});if(r.status===429)continue;if(!r.ok)throw Error(`${r.status}: ${url}`);return r.json();}throw Error('Rate limited: '+url);}
const clean=s=>String(s||'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&#0?39;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();
const result=JSON.parse(await readFile('src/data/bird-photos.json','utf8').catch(()=>'{}'));
await mkdir('public/assets/birds',{recursive:true});
for(const b of birds){
 if(result[b.id]?.length>=2)continue;
 const title=b.id==='cattle'?'Western cattle egret':b.id==='ibis'?'American white ibis':b.name.charAt(0)+b.name.slice(1).toLowerCase();
 const q=new URLSearchParams({action:'query',titles:title,redirects:'1',prop:'images|pageimages',imlimit:'100',piprop:'name',format:'json'});
 const page=Object.values((await json(`https://en.wikipedia.org/w/api.php?${q}`)).query.pages)[0];
 const words=[b.scientific,b.name.replaceAll('-',' '),b.id==='cattle'?'Bubulcus ibis':''].filter(Boolean).map(s=>s.toLowerCase());
 const candidates=[page.pageimage&&'File:'+page.pageimage,...(page.images||[]).map(x=>x.title)].filter(Boolean);
 const files=[...new Set(candidates.map(f=>f.replaceAll('_',' ')))].filter((f,i)=>/\.(jpg|jpeg|png)$/i.test(f)&&!/(map|range|distribution|egg|museum|skull|skeleton|drawing|stamp|25zz)/i.test(f)&&(i===0||words.some(w=>f.toLowerCase().replaceAll('_',' ').includes(w))));
 result[b.id]=[];
 for(const file of files){
  if(result[b.id].length===4)break;
  const params=new URLSearchParams({action:'query',titles:file,prop:'imageinfo',iiprop:'url|extmetadata',iiurlwidth:'960',format:'json'});
  const data=Object.values((await json(`https://commons.wikimedia.org/w/api.php?${params}`)).query.pages)[0]?.imageinfo?.[0];
  if(!data||result[b.id].some(p=>p.original===data.url))continue;const m=data.extmetadata||{};const license=clean(m.LicenseShortName?.value);
  if(!/^(CC BY|CC0|Public domain)/i.test(license))continue;
  const r=await fetch(data.thumburl||data.url,{headers});if(!r.ok)continue;
  const extension=r.headers.get('content-type')?.includes('png')?'png':'jpg';
  const src=`/assets/birds/${b.id}-${result[b.id].length+1}.${extension}`;
  await writeFile('public'+src,Buffer.from(await r.arrayBuffer()));
  result[b.id].push({src,title:file.replace(/^File:/,'').replaceAll('_',' '),description:clean(m.ImageDescription?.value),author:clean(m.Artist?.value),license,licenseUrl:(m.LicenseUrl?.value||'https://commons.wikimedia.org/wiki/Commons:Public_domain').replace('http://creativecommons.org/','https://creativecommons.org/'),source:data.descriptionurl,original:data.url});
 }
 console.log(b.id,result[b.id].length);
 if(result[b.id].length<2)throw Error(`Need more photos of ${b.name}`);
 await writeFile('src/data/bird-photos.json',JSON.stringify(result,null,2)+'\n');
}
