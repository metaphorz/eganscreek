// Bakes the voxel explorer's grid from USGS 3DEP elevation, NLCD land cover, USGS creek flowlines, and OpenStreetMap.
// Raw downloads are kept in node_modules/.cache so the grid can be rebuilt without asking the services again.
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
import {MAT} from '../voxel/materials.js';
const W=-81.47,E=-81.418,S=30.636,N=30.697,cols=520,rows=680,cache='node_modules/.cache/voxel-world';
const bbox=[W,S,E,N].join(','),agent='EgansCreekAtlas/1.0 (https://metaphorz.github.io/eganscreek/)';
await mkdir(cache,{recursive:true});
async function cached(name,url,options){const path=`${cache}/${name}`;if(existsSync(path))return readFile(path);const r=await fetch(url,{signal:AbortSignal.timeout(240000),...options});if(!r.ok)throw Error(`${name}: ${r.status}`);const data=Buffer.from(await r.arrayBuffer());await writeFile(path,data);return data;}
const dem3=`https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/exportImage?bbox=${bbox}&bboxSR=4326&imageSR=4326&size=${cols},${rows}&format=tiff&pixelType=F32&noDataInterpretation=esriNoDataMatchAny&interpolation=RSP_BilinearInterpolation&compression=NONE&f=image`;
const nlcdUrl=`https://www.mrlc.gov/geoserver/mrlc_display/NLCD_2021_Land_Cover_L48/ows?service=WMS&version=1.1.1&request=GetMap&layers=NLCD_2021_Land_Cover_L48&styles=&srs=EPSG:4326&bbox=${bbox}&width=${cols}&height=${rows}&format=image/png`;
const overpass=`[out:json][timeout:120][bbox:${S},${W},${N},${E}];(way[highway];way[building];way[natural=water];way[natural=beach];way[natural=sand];node[name];relation[leisure=park];way[leisure=park];);out geom;`;

// ArcGIS writes uncompressed little-endian float tiles or strips.
function readTiff(b){const count=b.readUInt16LE(8),tags=new Map();const size={3:2,4:4};
 for(let i=0;i<count;i++){const at=10+12*i,tag=b.readUInt16LE(at),type=b.readUInt16LE(at+2),n=b.readUInt32LE(at+4),width=size[type]||1,base=n*width>4?b.readUInt32LE(at+8):at+8;tags.set(tag,Array.from({length:n},(_,k)=>type===3?b.readUInt16LE(base+k*2):type===4?b.readUInt32LE(base+k*4):b[base+k]));}
 const w=tags.get(256)[0],h=tags.get(257)[0];if(tags.get(259)[0]!==1)throw Error('Expected an uncompressed elevation TIFF');const out=new Float32Array(w*h);
 const tileW=tags.get(322)?.[0]||w,tileH=tags.get(323)?.[0]||tags.get(278)?.[0]||h,offsets=tags.get(324)||tags.get(273);
 offsets.forEach((offset,i)=>{const across=Math.ceil(w/tileW),tx=(i%across)*tileW,ty=Math.floor(i/across)*tileH;for(let y=0;y<tileH&&ty+y<h;y++)for(let x=0;x<tileW&&tx+x<w;x++)out[(ty+y)*w+tx+x]=b.readFloatLE(offset+(y*tileW+x)*4);});return out;}
// NLCD arrives as an 8-bit palette PNG; only the classes matter, so this returns "r,g,b" per pixel.
function readPng(b){let at=8,palette,idat=[],w,h;while(at<b.length){const n=b.readUInt32BE(at),type=b.toString('latin1',at+4,at+8),data=b.subarray(at+8,at+8+n);if(type==='IHDR'){w=data.readUInt32BE(0);h=data.readUInt32BE(4);if(data[8]!==8||data[9]!==3)throw Error('Expected an 8-bit palette PNG');}if(type==='PLTE')palette=data;if(type==='IDAT')idat.push(data);at+=12+n;}
 const raw=inflateSync(Buffer.concat(idat)),out=new Array(w*h);let prev=new Uint8Array(w);
 for(let y=0;y<h;y++){const start=y*(w+1),filter=raw[start],row=new Uint8Array(w);for(let x=0;x<w;x++){const v=raw[start+1+x],a=x?row[x-1]:0,c=prev[x],d=x?prev[x-1]:0;let p=0;if(filter===1)p=a;else if(filter===2)p=c;else if(filter===3)p=(a+c)>>1;else if(filter===4){const q=a+c-d,pa=Math.abs(q-a),pb=Math.abs(q-c),pc=Math.abs(q-d);p=pa<=pb&&pa<=pc?a:pb<=pc?c:d;}row[x]=(v+p)&255;const i=row[x]*3;out[y*w+x]=`${palette[i]},${palette[i+1]},${palette[i+2]}`;}prev=row;}return out;}

const elevation=readTiff(await cached('dem.tif',dem3)),cover=readPng(await cached('nlcd.png',nlcdUrl));
const osm=JSON.parse(await cached('osm.json','https://overpass-api.de/api/interpreter',{method:'POST',headers:{'User-Agent':agent,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({data:overpass})}));
const creek=JSON.parse(await readFile('src/data/creek.json','utf8')),places=JSON.parse(await readFile('src/data/places.json','utf8'));

const NLCD={'71,107,160':MAT.water,'186,216,234':MAT.freshwater,'112,163,186':MAT.saltmarsh,'28,99,48':MAT.forest,'181,201,142':MAT.forest,'104,170,99':MAT.forest,'204,186,124':MAT.scrub,'226,226,193':MAT.grass,'219,216,61':MAT.grass,'221,201,201':MAT.lawn,'216,147,130':MAT.neighborhood,'237,0,0':MAT.town,'170,0,0':MAT.town,'178,173,163':MAT.sand};
const height=new Int8Array(cols*rows),mat=new Uint8Array(cols*rows),at=(x,z)=>z*cols+x,inside=(x,z)=>x>=0&&z>=0&&x<cols&&z<rows;
const cell=(lon,lat)=>[(lon-W)/(E-W)*cols,(N-lat)/(N-S)*rows],land=i=>mat[i]!==MAT.water&&mat[i]!==MAT.creek&&mat[i]!==MAT.bridge;
const metres=i=>{const e=elevation[i];return Number.isFinite(e)&&Math.abs(e)<60?e:null;};
const nearLand=(i,r)=>{const x=i%cols,z=(i-x)/cols;for(let dz=-r;dz<=r;dz++)for(let dx=-r;dx<=r;dx++)if(inside(x+dx,z+dz)&&(NLCD[cover[at(x+dx,z+dz)]]??MAT.water)!==MAT.water)return true;return false;};
for(let i=0;i<mat.length;i++){const e=metres(i),m=NLCD[cover[i]]??MAT.water;
 // The land-cover water class is 30 m wide; let clearly higher ground win along its edge.
 // Elevation is noisy over open ocean, so only ground beside mapped land counts, and only shores are shallow.
 if(e===null||(m===MAT.water&&(e<1.5||!nearLand(i,1)))){mat[i]=MAT.water;height[i]=e!==null&&e>-1&&nearLand(i,4)?-1:-3;continue;}
 // Tidal channels in the marsh show up in the elevation data below the marsh platform.
 if(m===MAT.saltmarsh&&e<.12){mat[i]=MAT.creek;height[i]=-1;continue;}
 // The same low ground south of Jasmine Street is held-back freshwater, not the creek itself.
 if(m===MAT.freshwater&&e<.12){mat[i]=MAT.water;height[i]=-1;continue;}
 mat[i]=m===MAT.water?MAT.scrub:m;height[i]=Math.max(1,Math.min(24,Math.round(e)));}
const stamp=(x,z,r,fn)=>{const cx=Math.round(x),cz=Math.round(z);for(let dz=-r;dz<=r;dz++)for(let dx=-r;dx<=r;dx++)if(inside(cx+dx,cz+dz)&&(r<1||dx*dx+dz*dz<=r*r+r))fn(at(cx+dx,cz+dz));};
function line(points,r,fn){for(let i=1;i<points.length;i++){const [ax,az]=points[i-1],[bx,bz]=points[i],steps=Math.ceil(Math.hypot(bx-ax,bz-az)*2)||1;for(let s=0;s<=steps;s++)stamp(ax+(bx-ax)*s/steps,az+(bz-az)*s/steps,r,fn);}}
function polygon(points,fn){if(points.length<3)return;const zs=points.map(p=>p[1]),top=Math.max(0,Math.floor(Math.min(...zs))),bottom=Math.min(rows-1,Math.ceil(Math.max(...zs)));for(let z=top;z<=bottom;z++){const c=z+.5,hits=[];for(let i=0;i<points.length;i++){const [ax,az]=points[i],[bx,bz]=points[(i+1)%points.length];if((az<=c)!==(bz<=c))hits.push(ax+(c-az)/(bz-az)*(bx-ax));}hits.sort((a,b)=>a-b);for(let k=0;k+1<hits.length;k+=2)for(let x=Math.max(0,Math.ceil(hits[k]-.5));x<=Math.min(cols-1,Math.floor(hits[k+1]-.5));x++)fn(at(x,z));}}
const geom=e=>(e.geometry||[]).map(p=>cell(p.lon,p.lat)),closed=e=>e.geometry?.length>3&&e.geometry[0].lat===e.geometry.at(-1).lat&&e.geometry[0].lon===e.geometry.at(-1).lon;
const ways=osm.elements.filter(e=>e.type==='way'&&e.tags);
for(const e of ways)if(['beach','sand'].includes(e.tags.natural)&&closed(e))polygon(geom(e),i=>{if(mat[i]!==MAT.water){mat[i]=MAT.sand;}});
for(const e of ways)if(e.tags.natural==='water'&&closed(e))polygon(geom(e),i=>{mat[i]=MAT.water;height[i]=-1;});

// The USGS line is one centered flowline, so it is widened enough to read and to float along.
const lines=creek.features.map(f=>f.geometry.coordinates);
for(const l of lines)line(l.map(p=>cell(p[0],p[1])),1,i=>{mat[i]=MAT.creek;height[i]=-2;});
// The float route is the shortest connected path through the flowlines from the southern end to the northern mouth.
const key=p=>`${p[0].toFixed(6)},${p[1].toFixed(6)}`,graph=new Map(),link=(a,b)=>{const d=Math.hypot(a[0]-b[0],a[1]-b[1]);if(!graph.has(key(a)))graph.set(key(a),{p:a,next:[]});graph.get(key(a)).next.push([key(b),d]);};
for(const l of lines)for(let i=1;i<l.length;i++){link(l[i-1],l[i]);link(l[i],l[i-1]);}
const nodes=[...graph.keys()],start=nodes.reduce((a,b)=>graph.get(b).p[1]<graph.get(a).p[1]?b:a),end=nodes.reduce((a,b)=>graph.get(b).p[1]>graph.get(a).p[1]?b:a);
const dist=new Map([[start,0]]),prev=new Map(),open=new Set([start]);
while(open.size){const u=[...open].reduce((a,b)=>dist.get(b)<dist.get(a)?b:a);open.delete(u);if(u===end)break;for(const [v,d] of graph.get(u).next){const nd=dist.get(u)+d;if(nd<(dist.get(v)??Infinity)){dist.set(v,nd);prev.set(v,u);open.add(v);}}}
if(!dist.has(end))throw Error('Creek flowlines do not connect its southern end to its mouth');
const chain=[end];while(chain.at(-1)!==start)chain.push(prev.get(chain.at(-1)));
const route=chain.reverse().map(k=>cell(...graph.get(k).p).map(v=>Math.round(v*10)/10));

// Roads and trails sit on top. A road crossing a channel becomes a bridge the float route passes under.
const roadWidth={trunk:1,primary:1,secondary:1,tertiary:0,unclassified:0,residential:0};
for(const e of ways){const r=roadWidth[e.tags.highway];if(r===undefined)continue;line(geom(e),r,i=>{if(land(i))mat[i]=MAT.road;else if(mat[i]===MAT.creek)mat[i]=MAT.bridge;});}
const greenway=e=>/egan|hiking and biking/i.test(e.tags.name||'')&&['path','footway','track','cycleway','bridleway'].includes(e.tags.highway);
for(const e of ways){const wild=g=>{const [x,z]=g.map(Math.round);return inside(x,z)&&[MAT.saltmarsh,MAT.freshwater,MAT.forest,MAT.scrub].includes(mat[at(x,z)]);};
 if(greenway(e)||(['path','track'].includes(e.tags.highway)&&geom(e).some(wild)))line(geom(e),0,i=>{if(land(i)&&mat[i]!==MAT.road)mat[i]=MAT.trail;});}
for(const e of ways)if(e.tags.building&&closed(e)){const g=geom(e),levels=Number(e.tags['building:levels'])||1,tall=Math.min(6,1+levels);const mark=i=>{if(land(i)&&mat[i]!==MAT.road&&mat[i]!==MAT.building){mat[i]=MAT.building;height[i]=Math.min(30,height[i]+tall);}};polygon(g,mark);const [x,z]=[g.reduce((s,p)=>s+p[0],0)/g.length,g.reduce((s,p)=>s+p[1],0)/g.length];if(inside(Math.floor(x),Math.floor(z)))mark(at(Math.floor(x),Math.floor(z)));}

const named=name=>{const e=osm.elements.find(e=>e.tags?.name===name);if(!e)return null;const p=e.lon!==undefined?[e.lon,e.lat]:e.center?[e.center.lon,e.center.lat]:e.bounds?[(e.bounds.minlon+e.bounds.maxlon)/2,(e.bounds.minlat+e.bounds.maxlat)/2]:null;return p&&cell(...p);};
const place=id=>{const f=places.features.find(f=>f.id===id);return cell(...f.geometry.coordinates);},round=p=>p.map(v=>Math.round(v*10)/10);
const clinch=named('Fort Clinch State Park');
const stops=[
 {id:'atlantic',name:'Atlantic Avenue',text:'Northern entrance to the Greenway, at the Atlantic Recreation Center. Salt marsh stretches away to the west.',at:round(place('atlantic'))},
 {id:'jasmine',name:'Jasmine Street',text:'Where the water systems change: tides reach the salt marsh to the north, while water controls protect freshwater habitat to the south.',at:round(place('jasmine'))},
 {id:'sadler',name:'Sadler Road',text:'Southern entrance to the Greenway, reached behind 2301 Sadler Road.',at:round(place('sadler'))},
 {id:'mouth',name:'The creek mouth',text:'The creek’s mapped flowline ends here at the Amelia River, where the tides come in.',at:route.at(-1)},
 {id:'south',name:'The southern reach',text:'The southern end of the mapped creek, far from its tidal mouth.',at:route[0]},
 clinch&&{id:'clinch',name:'Fort Clinch State Park',text:'Maritime forest and dunes at the northern tip of the island. Egans Creek runs along its southern and western side.',at:round(clinch)},
].filter(Boolean);
const meta={cols,rows,bounds:{west:W,south:S,east:E,north:N},blockMetres:{across:Math.round((E-W)*95800/cols*10)/10,along:Math.round((N-S)*110850/rows*10)/10,up:1},route,stops,retrieved:osm.osm3s?.timestamp_osm_base?.slice(0,10),sources:{elevation:'USGS 3DEP',landCover:'NLCD 2021 (MRLC)',creek:'USGS National Hydrography Dataset',features:'OpenStreetMap contributors (ODbL)'}};
await writeFile('public/data/voxel-world.bin',Buffer.concat([Buffer.from(height.buffer),Buffer.from(mat.buffer)]));
await writeFile('public/data/voxel-world.json',JSON.stringify(meta)+'\n');

// The header icon is the same grid, sampled coarsely and drawn as an isometric block model.
const COLORS=(await import('../voxel/materials.js')).COLORS,iconW=11,iconH=24,x0=145,x1=365,z0=30,z1=655,shade=(c,f)=>'#'+c.map(v=>Math.round(v*f).toString(16).padStart(2,'0')).join('');
const routeCells=new Set();for(let i=1;i<route.length;i++)for(let s=0;s<=8;s++){const x=route[i-1][0]+(route[i][0]-route[i-1][0])*s/8,z=route[i-1][1]+(route[i][1]-route[i-1][1])*s/8;routeCells.add(`${Math.floor((x-x0)/(x1-x0)*iconW)},${Math.floor((z-z0)/(z1-z0)*iconH)}`);}
const blocks=[];for(let gz=0;gz<iconH;gz++)for(let gx=0;gx<iconW;gx++){const count=new Map();let tall=0;const lx=x0+(x1-x0)*gx/iconW,rx=x0+(x1-x0)*(gx+1)/iconW,tz=z0+(z1-z0)*gz/iconH,bz=z0+(z1-z0)*(gz+1)/iconH;for(let z=Math.floor(tz);z<bz;z++)for(let x=Math.floor(lx);x<rx;x++){const m=mat[at(x,z)];const icon=m===MAT.building||m===MAT.road||m===MAT.trail?MAT.neighborhood:m===MAT.bridge?MAT.creek:m;count.set(icon,(count.get(icon)||0)+1);tall+=Math.max(0,Math.min(12,height[at(x,z)]));}
 let best=[...count].sort((a,b)=>b[1]-a[1])[0][0];if(routeCells.has(`${gx},${gz}`))best=MAT.creek;const n=(rx-lx)*(bz-tz),isWater=best===MAT.water||best===MAT.creek;blocks.push({gx,gz,m:best,h:isWater?0:Math.max(1,Math.round(tall/n/1.2))});}
const project=(gx,gz,h)=>[gx*5-gz*1.1,gx*1.7+gz*2.6-h*1.9];let polys='';const all=blocks.flatMap(b=>[project(b.gx,b.gz,b.h),project(b.gx+1,b.gz,b.h),project(b.gx,b.gz+1,-1),project(b.gx+1,b.gz+1,-1)]),minX=Math.min(...all.map(p=>p[0])),maxX=Math.max(...all.map(p=>p[0])),minY=Math.min(...all.map(p=>p[1])),maxY=Math.max(...all.map(p=>p[1]));const f=v=>Math.round(v*10)/10;
for(const b of blocks){const c=COLORS[b.m],n=project(b.gx,b.gz,b.h),e=project(b.gx+1,b.gz,b.h),s=project(b.gx+1,b.gz+1,b.h),w=project(b.gx,b.gz+1,b.h),sb=project(b.gx+1,b.gz+1,-1),wb=project(b.gx,b.gz+1,-1),eb=project(b.gx+1,b.gz,-1);const path=(pts,fill)=>{polys+=`<path fill="${fill}" d="M${pts.map(p=>`${f(p[0]-minX)} ${f(p[1]-minY)}`).join('L')}Z"/>`;};const front=blocks[(b.gz+1)*iconW+b.gx],right=b.gx+1<iconW?blocks[b.gz*iconW+b.gx+1]:null;if(!front||front.h<b.h)path([w,s,sb,wb],shade(c,.72));if(!right||right.h<b.h)path([s,e,eb,sb],shade(c,.58));path([n,e,s,w],shade(c,1));}
await writeFile('public/assets/voxel-creek.svg',`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f(maxX-minX)} ${f(maxY-minY)}">${polys}</svg>\n`);
const counts=Object.entries(MAT).map(([name,id])=>`${name} ${mat.filter(m=>m===id).length}`).join(', ');
console.log(`${cols}×${rows} world, ${route.length} route points, ${stops.length} stops\n${counts}`);
