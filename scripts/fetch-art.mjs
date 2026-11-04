// Builds src/data/art.json and public/assets/art/. License and source come from each work's online record, never typed in.
// Works must be public domain, CC0, or CC BY / CC BY-SA. The script stops on any other Commons record, and the art window shows the license and source for each work.
// Needs macOS sips and cwebp. crop is the fraction removed from each edge, for museum color bars in the scan.
import {writeFile,mkdtemp,rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const UA={'User-Agent':'EgansCreekAtlas/1.0 (https://metaphorz.github.io/eganscreek/)'},wait=ms=>new Promise(r=>setTimeout(r,ms));
const BIRDS='The Birds of America',QUADRUPEDS='The Viviparous Quadrupeds of North America',AUDUBON='John James Audubon',AUDUBONS='John James and John Woodhouse Audubon';
const works=[
 {key:'species:anhinga',file:'316 Black-bellied Darter.jpg',title:'Black-bellied Darter',artist:AUDUBON,date:'1827–38',note:`Plate 316, ${BIRDS}. Black-bellied Darter was Audubon’s name for the Anhinga.`},
 {key:'species:snowy',file:'242 Snowy Heron or White Egret.jpg',title:'Snowy Heron, or White Egret',artist:AUDUBON,date:'1827–38',note:`Plate 242, ${BIRDS}.`},
 {key:'species:great-egret',file:'386 White Heron.jpg',title:'White Heron',artist:AUDUBON,date:'1827–38',note:`Plate 386, ${BIRDS}. White Heron was Audubon’s name for the Great Egret.`},
 {key:'species:ibis',file:'222 White Ibis.jpg',title:'White Ibis',artist:AUDUBON,date:'1827–38',note:`Plate 222, ${BIRDS}.`},
 {key:'species:spoonbill',file:'321 Roseate Spoonbill.jpg',title:'Roseate Spoonbill',artist:AUDUBON,date:'1827–38',note:`Plate 321, ${BIRDS}.`},
 {key:'species:stork',file:'216 Wood Ibiss.jpg',title:'Wood Ibiss',artist:AUDUBON,date:'1827–38',note:`Plate 216, ${BIRDS}. Wood Ibiss was Audubon’s name for the Wood Stork.`},
 {key:'species:tricolored',file:'217 Louisiana Heron.jpg',title:'Louisiana Heron',artist:AUDUBON,date:'1827–38',note:`Plate 217, ${BIRDS}. Louisiana Heron was Audubon’s name for the Tricolored Heron.`},
 {key:'species:great-blue',file:'211 Great blue Heron.jpg',title:'Great Blue Heron',artist:AUDUBON,date:'1827–38',note:`Plate 211, ${BIRDS}.`},
 {key:'species:green',file:'333 Green Heron.jpg',title:'Green Heron',artist:AUDUBON,date:'1827–38',note:`Plate 333, ${BIRDS}.`},
 {key:'species:little-blue',file:'307 Blue Crane or Heron.jpg',title:'Blue Crane or Heron',artist:AUDUBON,date:'1827–38',note:`Plate 307, ${BIRDS}. Blue Crane or Heron was Audubon’s name for the Little Blue Heron.`},
 {key:'species:yellow-crown',file:'336 Yellow-Crowned Heron.jpg',title:'Yellow-crowned Heron',artist:AUDUBON,date:'1827–38',note:`Plate 336, ${BIRDS}.`},
 {key:'species:black-crown',file:'236 Night Heron or Qua bird.jpg',title:'Night Heron, or Qua Bird',artist:AUDUBON,date:'1827–38',note:`Plate 236, ${BIRDS}.`},
 {key:'species:43102',file:'Marsh Hare, Lepus Palustris, Bachman, Natural Size - DPLA - 2474b67e086f4d73537d850c62196acb.jpg',title:'Marsh Hare',artist:AUDUBONS,date:'1845–48',note:`${QUADRUPEDS}.`,crop:{bottom:.13}},
 {key:'species:41663',file:'Raccoon, Procyon Lotor, Cuvier. Male, Natural Size - DPLA - 316f06051ffcb90e04b4580b25e10664.jpg',title:'Raccoon',artist:AUDUBONS,date:'1845–48',note:`${QUADRUPEDS}.`,crop:{bottom:.11}},
 {key:'species:42223',file:'Common American Deer, Cervus Virginianus, Pennant. Fawn. Natural Size - DPLA - 40866d1133481a7b7d9f28e6141a2b9d.jpg',title:'Common American Deer, fawn',artist:AUDUBONS,date:'1845–48',note:`${QUADRUPEDS}.`,crop:{bottom:.12}},
 {key:'species:46017',file:'Carolina Grey Squirrel, Sciurus Carolinensis, Gmelin, Natural Size, Male and Female - DPLA - 9ba28d9fdca0e2f1c8db85ea198ec17f.jpg',title:'Carolina Grey Squirrel',artist:AUDUBONS,date:'1845–48',note:`${QUADRUPEDS}.`,crop:{right:.16}},
 {key:'species:26159',file:'Sargent - Muddy Alligators.jpg',title:'Muddy Alligators',artist:'John Singer Sargent',date:'1917',note:'Watercolor from Sargent’s 1917 trip to Florida.'},
 {key:'species:53491',file:'21 Mocking Bird.jpg',title:'Mocking Bird',artist:AUDUBON,date:'1827–38',note:`Plate 21, ${BIRDS}. Mockingbirds defend their nest from a rattlesnake.`},
 {key:'species:47585',file:'Pieter Claesz. - Still Life with Wine Goblet and Oysters - 56.883 - Museum of Fine Arts.jpg',title:'Still Life with Wine Goblet and Oysters',artist:'Pieter Claesz',date:'1639',note:'Dutch Golden Age still life, painted in Haarlem. Museum of Fine Arts, Boston.'},
 {key:'species:47902',url:'https://www.oldbookillustrations.com/site/assets/high-res/1885-1891/prickly-pear-768.jpg',source:'https://www.oldbookillustrations.com/illustrations/prickly-pear/',license:'Public domain in the US',title:'Prickly Pear',artist:'Unknown engraver',date:'1885–91',note:'Wood engraving from Nouveau dictionnaire encyclopédique universel illustré, edited by Jules Trousset.'},
 {key:'place:butterflies',file:'Butterfly in Florida.JPG',title:'Butterfly in Florida',artist:'Photograph by MathewTownsend',date:'2010',note:'Photographed in Tampa, Florida. Resized for this site.'},
 {key:'stage:4',file:'The Great Florida Marsh Martin Johnson Heade 1886.jpeg',title:'The Great Florida Marsh',artist:'Martin Johnson Heade',date:'1886',note:'Heade painted this after settling in St. Augustine, on the same northeast Florida coast.'},
 {key:'species:773004',file:'Martin Johnson Heade - Haystacks on the Newburyport Marshes - Walters 372531.jpg',title:'Haystacks on the Newburyport Marshes',artist:'Martin Johnson Heade',date:'1862',note:'Massachusetts rather than Florida. Salt hay, cut and stacked here, came largely from this grass.'},
 {key:'place:coast',file:'Fort George Island, Florida SAAM-1970.73 1.jpg',title:'Fort George Island, Florida',artist:'Thomas Moran',date:'1878',note:'Fort George Island lies south of Amelia Island on the same coast. Smithsonian American Art Museum.'},
 {key:'chapter:tides',file:'Eagle Head, Manchester, Massachusetts (High Tide) MET DT517.jpg',title:'Eagle Head, Manchester, Massachusetts (High Tide)',artist:'Winslow Homer',date:'1870',note:'High tide on a Massachusetts beach. The Metropolitan Museum of Art.'},
 {key:'place:river',file:'Winslow Homer - Blue Spring, Florida.jpg',title:'Blue Spring, Florida',artist:'Winslow Homer',date:'1890',note:'A different Florida waterway, chosen as a companion to the Amelia River.'}
];
const slug=key=>key.split(':')[1],license_url=rec=>rec.licenseUrl?{licenseUrl:rec.licenseUrl}:{};
const dir=await mkdtemp(join(tmpdir(),'art-'));
async function record(file){await wait(3000);const u=new URL('https://commons.wikimedia.org/w/api.php');for(const [k,v] of Object.entries({action:'query',format:'json',titles:`File:${file}`,prop:'imageinfo',iiprop:'url|extmetadata',iiurlwidth:'960'}))u.searchParams.set(k,v);
 const i=Object.values((await (await fetch(u,{headers:UA})).json()).query.pages)[0].imageinfo?.[0];if(!i)throw new Error(`No Commons record: ${file}`);
 const license=i.extmetadata.LicenseShortName?.value;if(!/^(Public domain|CC0|CC BY(-SA)? [\d.]+)$/.test(license))throw new Error(`${file} is ${license}, which this site does not use`);return {url:i.thumburl,source:i.descriptionurl,license,licenseUrl:i.extmetadata.LicenseUrl?.value};}
async function download(url){for(let t=0;t<5;t++){await wait(2500);const r=await fetch(url,{headers:UA});if(r.ok)return Buffer.from(await r.arrayBuffer());await wait(20000);}throw new Error(`Could not download ${url}`);}
const size=path=>{const out=execFileSync('sips',['-g','pixelWidth','-g','pixelHeight',path],{encoding:'utf8'});return [Number(out.match(/pixelWidth: (\d+)/)[1]),Number(out.match(/pixelHeight: (\d+)/)[1])];};
const out=[];
for(const w of works){const {key,file,crop,url:direct,source:directSource,license:directLicense,...fields}=w,rec=file?await record(file):{url:direct,source:directSource,license:directLicense},raw=join(dir,'raw'),png=join(dir,'art.png'),image=`assets/art/${slug(key)}.webp`;
 await writeFile(raw,await download(rec.url));execFileSync('sips',['-s','format','png',raw,'--out',png],{stdio:'ignore'});let [width,height]=size(png);
 if(crop){const x=Math.round(width*(crop.left||0)),y=Math.round(height*(crop.top||0)),cw=width-x-Math.round(width*(crop.right||0)),ch=height-y-Math.round(height*(crop.bottom||0));execFileSync('cwebp',['-quiet','-q','74','-crop',String(x),String(y),String(cw),String(ch),png,'-o',`public/${image}`]);width=cw;height=ch;}
 else execFileSync('cwebp',['-quiet','-q','74',png,'-o',`public/${image}`]);
 out.push({key,...fields,license:rec.license,...(license_url(rec)),source:rec.source,image,width,height});console.log(key,rec.license);}
await rm(dir,{recursive:true});
await writeFile('src/data/art.json',JSON.stringify({retrieved:new Date().toISOString().slice(0,10),works:out},null,1)+'\n');
console.log(`${out.length} works`);
