// Bakes the voxel explorer's grid from USGS 3DEP elevation, NLCD land cover, USGS creek flowlines, and OpenStreetMap.
// Raw downloads are kept in node_modules/.cache so the grid can be rebuilt without asking the services again.
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
import {MAT} from '../voxel/materials.js';
import {RAMPART_TOE,fortPlan,insidePolygon} from '../voxel/fort.js';
// The north edge falls in the open sound, past the tip of Amelia Island and short of Cumberland Island.
const W=-81.47,E=-81.418,S=30.636,N=30.713,cols=520,rows=858,cache=`node_modules/.cache/voxel-world-${N}`;
// OpenStreetMap ways the model is built around. The build stops if one disappears, rather than guessing.
const PATH_TO_JASMINE=263899124,PATH_SOUTH_OF_JASMINE=653676990,JASMINE_STREET=11129139,FORT_CLINCH=202321937,DRAW_BRIDGE=1333664322,FORT_WALK=1290472064,NORTH_BASTION=[-81.4541168,30.7055333],FLAGPOLE=[-81.454323,30.7047838],ATLANTIC_CROSSING=[-81.43955,30.6676],HUG=1.6;
const bbox=[W,S,E,N].join(','),agent='EgansCreekAtlas/1.0 (https://metaphorz.github.io/eganscreek/)';
await mkdir(cache,{recursive:true});
async function cached(name,url,options){const path=`${cache}/${name}`;if(existsSync(path))return readFile(path);const r=await fetch(url,{signal:AbortSignal.timeout(240000),...options});if(!r.ok)throw Error(`${name}: ${r.status}`);const data=Buffer.from(await r.arrayBuffer());await writeFile(path,data);return data;}
const dem3=`https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/exportImage?bbox=${bbox}&bboxSR=4326&imageSR=4326&size=${cols},${rows}&format=tiff&pixelType=F32&noDataInterpretation=esriNoDataMatchAny&interpolation=RSP_BilinearInterpolation&compression=NONE&f=image`;
const nlcdUrl=`https://www.mrlc.gov/geoserver/mrlc_display/NLCD_2021_Land_Cover_L48/ows?service=WMS&version=1.1.1&request=GetMap&layers=NLCD_2021_Land_Cover_L48&styles=&srs=EPSG:4326&bbox=${bbox}&width=${cols}&height=${rows}&format=image/png`;
const overpass=`[out:json][timeout:120][bbox:${S},${W},${N},${E}];(way[highway];way[building];way[historic];node[historic];way[natural=water];way[natural=beach];way[natural=sand];node[name];relation[leisure=park];way[leisure=park];);out geom;`;

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
// The Greenway runs from Atlantic Avenue to Sadler Road, between the town and the beach neighborhoods.
const [greenwayW,greenwayN]=cell(-81.4455,30.6683),[greenwayE,greenwayS]=cell(-81.4355,30.6395),inGreenwayCell=(x,z)=>x>=greenwayW&&x<=greenwayE&&z>=greenwayN&&z<=greenwayS,inGreenway=i=>inGreenwayCell(i%cols,Math.floor(i/cols));
const nearLand=(i,r)=>{const x=i%cols,z=(i-x)/cols;for(let dz=-r;dz<=r;dz++)for(let dx=-r;dx<=r;dx++)if(inside(x+dx,z+dz)&&(NLCD[cover[at(x+dx,z+dz)]]??MAT.water)!==MAT.water)return true;return false;};
for(let i=0;i<mat.length;i++){const e=metres(i),m=NLCD[cover[i]]??MAT.water;
 // The land-cover water class is 30 m wide; let clearly higher ground win along its edge.
 // Elevation is noisy over open ocean, so only ground beside mapped land counts, and only shores are shallow.
 if(e===null||(m===MAT.water&&(e<1.5||!nearLand(i,1)))){mat[i]=MAT.water;height[i]=e!==null&&e>-1&&nearLand(i,4)?-1:-3;continue;}
 // On the Greenway, low ground reads as water in the elevation data but is mostly cordgrass on site.
 if(inGreenway(i)&&(m===MAT.saltmarsh||m===MAT.freshwater)){mat[i]=MAT.freshwater;height[i]=Math.max(1,Math.min(24,Math.round(e)));continue;}
 // Tidal channels in the northern marsh show up in the elevation data below the marsh platform.
 if(m===MAT.saltmarsh&&e<.12){mat[i]=MAT.creek;height[i]=-1;continue;}
 if(m===MAT.freshwater&&e<.12){mat[i]=MAT.water;height[i]=-1;continue;}
 mat[i]=m===MAT.water?MAT.scrub:m;height[i]=Math.max(1,Math.min(24,Math.round(e)));}
const stamp=(x,z,r,fn)=>{const cx=r<1?Math.floor(x):Math.round(x),cz=r<1?Math.floor(z):Math.round(z);for(let dz=-r;dz<=r;dz++)for(let dx=-r;dx<=r;dx++)if(inside(cx+dx,cz+dz)&&(r<1||dx*dx+dz*dz<=r*r+r))fn(at(cx+dx,cz+dz));};
function line(points,r,fn){for(let i=1;i<points.length;i++){const [ax,az]=points[i-1],[bx,bz]=points[i],steps=Math.ceil(Math.hypot(bx-ax,bz-az)*8)||1;let lastX=null,lastZ=null;for(let s=0;s<=steps;s++){const x=ax+(bx-ax)*s/steps,z=az+(bz-az)*s/steps;stamp(x,z,r,fn);
 // A one-block line that steps diagonally fills the corner, so paths and channels connect edge to edge.
 const fx=Math.floor(x),fz=Math.floor(z);if(r<1&&lastX!==null&&fx!==lastX&&fz!==lastZ){stamp(lastX,fz,0,fn);stamp(fx,lastZ,0,fn);}lastX=fx;lastZ=fz;}}}
function polygon(points,fn){if(points.length<3)return;const zs=points.map(p=>p[1]),top=Math.max(0,Math.floor(Math.min(...zs))),bottom=Math.min(rows-1,Math.ceil(Math.max(...zs)));for(let z=top;z<=bottom;z++){const c=z+.5,hits=[];for(let i=0;i<points.length;i++){const [ax,az]=points[i],[bx,bz]=points[(i+1)%points.length];if((az<=c)!==(bz<=c))hits.push(ax+(c-az)/(bz-az)*(bx-ax));}hits.sort((a,b)=>a-b);for(let k=0;k+1<hits.length;k+=2)for(let x=Math.max(0,Math.ceil(hits[k]-.5));x<=Math.min(cols-1,Math.floor(hits[k+1]-.5));x++)fn(at(x,z));}}
const geom=e=>(e.geometry||[]).map(p=>cell(p.lon,p.lat)),closed=e=>e.geometry?.length>3&&e.geometry[0].lat===e.geometry.at(-1).lat&&e.geometry[0].lon===e.geometry.at(-1).lon;
const ways=osm.elements.filter(e=>e.type==='way'&&e.tags);
for(const e of ways)if(['beach','sand'].includes(e.tags.natural)&&closed(e))polygon(geom(e),i=>{if(mat[i]!==MAT.water){mat[i]=MAT.sand;}});
for(const e of ways)if(e.tags.natural==='water'&&closed(e))polygon(geom(e),i=>{if(mat[i]===MAT.freshwater&&inGreenway(i))return;mat[i]=MAT.water;height[i]=-1;});

// North of Atlantic Avenue the tidal creek is widened enough to read. The narrow Greenway channel is added below.
const lines=creek.features.map(f=>f.geometry.coordinates);
for(const l of lines)line(l.map(p=>cell(p[0],p[1])),1,i=>{if(inGreenway(i))return;mat[i]=MAT.creek;height[i]=-2;});
// The float route is the shortest connected path through the flowlines from the southern end to the northern mouth.
const key=p=>`${p[0].toFixed(6)},${p[1].toFixed(6)}`,graph=new Map(),link=(a,b)=>{const d=Math.hypot(a[0]-b[0],a[1]-b[1]);if(!graph.has(key(a)))graph.set(key(a),{p:a,next:[]});graph.get(key(a)).next.push([key(b),d]);};
for(const l of lines)for(let i=1;i<l.length;i++){link(l[i-1],l[i]);link(l[i],l[i-1]);}
const nodes=[...graph.keys()],start=nodes.reduce((a,b)=>graph.get(b).p[1]<graph.get(a).p[1]?b:a),end=nodes.reduce((a,b)=>graph.get(b).p[1]>graph.get(a).p[1]?b:a);
const dist=new Map([[start,0]]),prev=new Map(),open=new Set([start]);
while(open.size){const u=[...open].reduce((a,b)=>dist.get(b)<dist.get(a)?b:a);open.delete(u);if(u===end)break;for(const [v,d] of graph.get(u).next){const nd=dist.get(u)+d;if(nd<(dist.get(v)??Infinity)){dist.set(v,nd);prev.set(v,u);open.add(v);}}}
if(!dist.has(end))throw Error('Creek flowlines do not connect its southern end to its mouth');
const chain=[end];while(chain.at(-1)!==start)chain.push(prev.get(chain.at(-1)));
const mapped=chain.reverse().map(k=>cell(...graph.get(k).p));
const wayById=id=>{const e=osm.elements.find(e=>e.type==='way'&&e.id===id);if(!e)throw Error(`OpenStreetMap way ${id} is missing`);return geom(e);},nearestIndex=(list,p,from=0)=>{let best=from,d=Infinity;for(let i=from;i<list.length;i++){const q=Math.hypot(list[i][0]-p[0],list[i][1]-p[1]);if(q<d){d=q;best=i;}}return best;};
// On the Greenway the channel follows the site owner's account rather than the mapped flowline: walking south from
// Atlantic Avenue, and again south of Jasmine Street, the creek is just to the walker's right.
const pathNorth=wayById(PATH_TO_JASMINE).slice().reverse(),southWay=wayById(PATH_SOUTH_OF_JASMINE).slice().reverse(),pathSouth=southWay.slice(0,southWay.reduce((best,p,i)=>p[1]>southWay[best][1]?i:best,0)+1);
// Shifts a path toward a south-bound walker's right, using the average direction at each bend.
const onRight=(path,by)=>path.map((p,i)=>{const a=path[Math.max(0,i-1)],b=path[Math.min(path.length-1,i+1)],dx=b[0]-a[0],dz=b[1]-a[1],n=Math.hypot(dx,dz)||1;return [p[0]-dz/n*by,p[1]+dx/n*by];});
const jasmine=wayById(JASMINE_STREET).slice().sort((a,b)=>a[0]-b[0]),streetZ=x=>{const i=Math.max(1,jasmine.findIndex(p=>p[0]>=x)),a=jasmine[i-1],b=jasmine[i];return a[1]+(b[1]-a[1])*(x-a[0])/((b[0]-a[0])||1);};
const southHug=onRight(pathSouth.slice(0,-1),HUG).reverse(),northHug=onRight(pathNorth,HUG).reverse().filter(([x,z])=>z<streetZ(x)-2.5);
// It passes under Jasmine Street just west of the walker's left turn, then keeps to the north side of the street,
// so the short walk along the road never crosses it. At the top it cuts across to the Atlantic Avenue bridge.
const crossX=southHug.at(-1)[0],alongStreet=[];for(let x=crossX;x<northHug[0][0];x+=2)alongStreet.push([x,streetZ(x)-2]);
const route=[...southHug,...alongStreet,...northHug,...mapped.slice(nearestIndex(mapped,cell(...ATLANTIC_CROSSING)))].map(p=>p.map(v=>Math.round(v*10)/10));
line(route,0,i=>{if(mat[i]!==MAT.creek){mat[i]=MAT.creek;height[i]=-1;}});

// Roads and trails sit on top. A road crossing a channel becomes a bridge the float route passes under.
const roadWidth={trunk:1,primary:1,secondary:1,tertiary:0,unclassified:0,residential:0};
for(const e of ways){const r=roadWidth[e.tags.highway];if(r===undefined)continue;line(geom(e),r,i=>{if(land(i))mat[i]=MAT.road;else if(mat[i]===MAT.creek)mat[i]=MAT.bridge;});}
const greenway=e=>/egan|hiking and biking/i.test(e.tags.name||'')&&['path','footway','track','cycleway','bridleway'].includes(e.tags.highway);
for(const e of ways){const wild=g=>{const [x,z]=g.map(Math.round);return inside(x,z)&&[MAT.saltmarsh,MAT.freshwater,MAT.forest,MAT.scrub].includes(mat[at(x,z)]);};
 if(greenway(e)||(['path','track'].includes(e.tags.highway)&&geom(e).some(wild)))line(geom(e),0,i=>{if(mat[i]===MAT.creek)mat[i]=MAT.bridge;else if(land(i)&&mat[i]!==MAT.road)mat[i]=MAT.trail;});}
for(const e of ways)if(e.tags.building&&closed(e)){const g=geom(e),levels=Number(e.tags['building:levels'])||1,tall=Math.min(6,1+levels);const mark=i=>{if(land(i)&&mat[i]!==MAT.road&&mat[i]!==MAT.building){mat[i]=MAT.building;height[i]=Math.min(30,height[i]+tall);}};polygon(g,mark);const [x,z]=[g.reduce((s,p)=>s+p[0],0)/g.length,g.reduce((s,p)=>s+p[1],0)/g.length];if(inside(Math.floor(x),Math.floor(z)))mark(at(Math.floor(x),Math.floor(z)));}

// Fort Clinch is drawn from its mapped plan by voxel/fort.js. This grid only records where a walker can go.
const fortRound=p=>p.map(v=>Math.round(v*100)/100),gap=(p,q)=>Math.hypot(p[0]-q[0],p[1]-q[1]),fortOutline=wayById(FORT_CLINCH).slice(0,-1),drawBridge=wayById(DRAW_BRIDGE),fortGate=fortOutline[nearestIndex(fortOutline,drawBridge[1])];
// Long sides are curtain walls and runs of short sides are bastions. The gate's map point splits one curtain in two.
const fortStart=fortOutline.findIndex((p,i)=>gap(p,fortOutline[(i+1)%fortOutline.length])>5),fortLoop=[...fortOutline.slice(fortStart),...fortOutline.slice(0,fortStart)],curtains=[],bastions=[];let fortRun=[];
fortLoop.forEach((p,i)=>{const q=fortLoop[(i+1)%fortLoop.length];if(gap(p,q)>5){if(fortRun.length){bastions.push(fortRun);fortRun=[];}if(curtains.length&&curtains.at(-1)[1]===p)curtains.at(-1)[1]=q;else curtains.push([p,q]);}else{if(!fortRun.length)fortRun.push(p);fortRun.push(q);}});if(fortRun.length)bastions.push(fortRun);
if(curtains.length!==5||bastions.length!==5)throw Error(`Fort Clinch should have 5 curtains and 5 bastions, not ${curtains.length} and ${bastions.length}`);
const middle=poly=>poly.reduce((s,p)=>[s[0]+p[0]/poly.length,s[1]+p[1]/poly.length],[0,0]),fortCenter=middle(bastions.map(middle)),fortCells=new Set();polygon(fortOutline,i=>fortCells.add(i));
// The fort sits level with the shore around it, so its ground takes the lowest land height nearby.
const fortGround=Math.max(1,Math.min(...[...fortCells].map(i=>height[i]).filter(h=>h>0))),inFort=e=>{const c=middle(geom(e));return insidePolygon(fortOutline,c[0],c[1]);};
const fortBuildings=ways.filter(e=>e.tags.building&&e.tags.name&&inFort(e)).map(e=>({name:e.tags.name,poly:geom(e).slice(0,-1).map(fortRound)})),fortRuins=ways.filter(e=>e.tags.historic==='ruins'&&inFort(e)).map(e=>geom(e).slice(0,-1).map(fortRound));
const cannons=osm.elements.filter(e=>e.type==='node'&&e.tags?.historic==='cannon').map(e=>fortRound(cell(e.lon,e.lat))).filter(([x,z])=>insidePolygon(fortOutline,x,z));
const fortData={center:fortRound(fortCenter),ground:fortGround,curtains:curtains.map(c=>c.map(fortRound)),bastions:bastions.map(b=>b.map(fortRound)),greenBastion:nearestIndex(bastions.map(middle),cell(...NORTH_BASTION)),gate:fortRound(fortGate),bridge:drawBridge.map(fortRound),buildings:fortBuildings,ruins:fortRuins,cannons,flag:fortRound(cell(...FLAGPOLE))};
// Trees are cleared around the walls so the outline reads, as in aerial photographs of the fort.
for(const i of fortCells)stamp(i%cols,Math.floor(i/cols),8,c=>{if(mat[c]===MAT.forest||mat[c]===MAT.scrub)mat[c]=MAT.grass;});
const fortBlock=i=>{mat[i]=MAT.fort;height[i]=fortGround;},parade=fortPlan(fortData).ring(RAMPART_TOE);
for(const i of fortCells){if(insidePolygon(parade,i%cols+.5,Math.floor(i/cols)+.5)){mat[i]=MAT.fortyard;height[i]=fortGround;}else fortBlock(i);}
for(const b of bastions)polygon(b,i=>{if(fortCells.has(i))fortBlock(i);});for(const b of fortBuildings)if(/Barracks|Storehouse/.test(b.name))polygon(b.poly,fortBlock);
// The way in stays open: over the Draw Bridge, through the wall, and between the Guard Rooms and the Prison.
line([drawBridge[0],[fortGate[0]+(fortCenter[0]-fortGate[0])*.75,fortGate[1]+(fortCenter[1]-fortGate[1])*.75]],1,i=>{if(mat[i]===MAT.fort){mat[i]=MAT.fortyard;height[i]=fortGround;}});
// A visitor arrives in line with the bridge and walkway, so walking straight ahead leads through to the parade ground.
const fortOut=[fortGate[0]-fortCenter[0],fortGate[1]-fortCenter[1]],fortOutLength=Math.hypot(...fortOut),fortArrival=[drawBridge[0][0]+fortOut[0]/fortOutLength*6,drawBridge[0][1]+fortOut[1]/fortOutLength*6];
const fortWalk=wayById(FORT_WALK).slice().reverse();for(const leg of [[drawBridge[0],...fortWalk],[drawBridge[0],fortArrival]])line(leg,0,i=>{if(land(i)&&mat[i]!==MAT.road&&mat[i]!==MAT.fort&&mat[i]!==MAT.fortyard)mat[i]=MAT.trail;});
const place=id=>{const f=places.features.find(f=>f.id===id);return cell(...f.geometry.coordinates);},round=p=>p.map(v=>Math.round(v*10)/10);
// Walking starts are on the path itself, facing the way it heads south. Both ways are drawn south to north.
// Each start sits a few blocks along the path, clear of the place marker, and looks well ahead down it.
const walk=(id,label,name,text,way)=>{const all=way.flatMap((p,i)=>{if(!i)return [p];const a=way[i-1],n=Math.ceil(Math.hypot(p[0]-a[0],p[1]-a[1]));return Array.from({length:n},(_,s)=>[a[0]+(p[0]-a[0])*(s+1)/n,a[1]+(p[1]-a[1])*(s+1)/n]);}).map(round),marker=place(id),first=all.findIndex(p=>mat[at(Math.floor(p[0]),Math.floor(p[1]))]===MAT.trail&&Math.hypot(p[0]-marker[0],p[1]-marker[1])>=5);if(first<0)throw Error(`${id} walk has no path cells`);const path=all.slice(first),ahead=path.find(p=>Math.hypot(p[0]-path[0][0],p[1]-path[0][1])>=14)||path.at(-1);return {id,label,name,text,at:path[0].map(v=>Math.floor(v)+.5),facing:ahead,path};};
const walks=[
 walk('atlantic','Walk south from Atlantic Avenue','South from Atlantic Avenue','Follow the tan path south with the creek on your right. At Jasmine Street, cross and turn right along the road. After a short walk, turn left onto the next path.',pathNorth),
 walk('jasmine','Walk south from Jasmine Street','South from Jasmine Street','Follow the tan path south through the cordgrass, with the creek on your right.',pathSouth),
];
// Small signs mark the two turns on the walk from one path to the next.
const signs=[{id:'cross',name:'Cross, then turn right',at:round([pathNorth.at(-1)[0]+1.5,streetZ(pathNorth.at(-1)[0])-2]),sign:true},{id:'turn',name:'Turn left: path continues',at:round([pathSouth[0][0]+1.5,streetZ(pathSouth[0][0])+2]),sign:true}];
const stops=[
 {id:'atlantic',name:'Atlantic Avenue',text:'Northern entrance to the Greenway, at the Atlantic Recreation Center. Salt marsh stretches away to the west.',at:round(place('atlantic'))},
 {id:'jasmine',name:'Jasmine Street',text:'Where the water systems change: tides reach the salt marsh to the north, while water controls protect freshwater habitat to the south.',at:round(place('jasmine'))},
 {id:'sadler',name:'Sadler Road',text:'Southern entrance to the Greenway, reached behind 2301 Sadler Road.',at:round(place('sadler'))},
 {id:'mouth',name:'The creek mouth',text:'The creek’s mapped flowline ends here at the Amelia River, where the tides come in.',at:route.at(-1)},
 {id:'south',name:'The southern reach',text:'The southern end of the mapped creek, far from its tidal mouth.',at:route[0]},
 {id:'fort',name:'Fort Clinch',text:'A five-sided brick fort with corner bastions, begun in 1847. Walk in over the Draw Bridge: the walkway passes between the Guard Rooms and the Prison, then opens onto the parade ground.',at:round(fortArrival),facing:fortData.center,labelAt:fortData.center,altitude:30},
];
const meta={cols,rows,bounds:{west:W,south:S,east:E,north:N},blockMetres:{across:Math.round((E-W)*95800/cols*10)/10,along:Math.round((N-S)*110850/rows*10)/10,up:1},route,stops,walks,signs,fort:fortData,retrieved:osm.osm3s?.timestamp_osm_base?.slice(0,10),sources:{elevation:'USGS 3DEP',landCover:'NLCD 2021 (MRLC)',creek:'USGS National Hydrography Dataset',features:'OpenStreetMap contributors (ODbL)'}};
await writeFile('voxel/voxel-world.bin',Buffer.concat([Buffer.from(height.buffer),Buffer.from(mat.buffer)]));
await writeFile('voxel/voxel-world.json',JSON.stringify(meta)+'\n');

// The header icon is the same grid, sampled coarsely and drawn as an isometric block model.
const COLORS=(await import('../voxel/materials.js')).COLORS,iconW=11,iconH=24,x0=145,x1=365,z0=208,z1=833,shade=(c,f)=>'#'+c.map(v=>Math.round(v*f).toString(16).padStart(2,'0')).join('');
const routeCells=new Set();for(let i=1;i<route.length;i++)for(let s=0;s<=8;s++){const x=route[i-1][0]+(route[i][0]-route[i-1][0])*s/8,z=route[i-1][1]+(route[i][1]-route[i-1][1])*s/8;routeCells.add(`${Math.floor((x-x0)/(x1-x0)*iconW)},${Math.floor((z-z0)/(z1-z0)*iconH)}`);}
const blocks=[];for(let gz=0;gz<iconH;gz++)for(let gx=0;gx<iconW;gx++){const count=new Map();let tall=0;const lx=x0+(x1-x0)*gx/iconW,rx=x0+(x1-x0)*(gx+1)/iconW,tz=z0+(z1-z0)*gz/iconH,bz=z0+(z1-z0)*(gz+1)/iconH;for(let z=Math.floor(tz);z<bz;z++)for(let x=Math.floor(lx);x<rx;x++){const m=mat[at(x,z)];const icon=m===MAT.building||m===MAT.road||m===MAT.trail?MAT.neighborhood:m===MAT.bridge?MAT.creek:m;count.set(icon,(count.get(icon)||0)+1);tall+=Math.max(0,Math.min(12,height[at(x,z)]));}
 let best=[...count].sort((a,b)=>b[1]-a[1])[0][0];if(routeCells.has(`${gx},${gz}`))best=MAT.creek;const n=(rx-lx)*(bz-tz),isWater=best===MAT.water||best===MAT.creek;blocks.push({gx,gz,m:best,h:isWater?0:Math.max(1,Math.round(tall/n/1.2))});}
const project=(gx,gz,h)=>[gx*5-gz*1.1,gx*1.7+gz*2.6-h*1.9];let polys='';const all=blocks.flatMap(b=>[project(b.gx,b.gz,b.h),project(b.gx+1,b.gz,b.h),project(b.gx,b.gz+1,-1),project(b.gx+1,b.gz+1,-1)]),minX=Math.min(...all.map(p=>p[0])),maxX=Math.max(...all.map(p=>p[0])),minY=Math.min(...all.map(p=>p[1])),maxY=Math.max(...all.map(p=>p[1]));const f=v=>Math.round(v*10)/10;
for(const b of blocks){const c=COLORS[b.m],n=project(b.gx,b.gz,b.h),e=project(b.gx+1,b.gz,b.h),s=project(b.gx+1,b.gz+1,b.h),w=project(b.gx,b.gz+1,b.h),sb=project(b.gx+1,b.gz+1,-1),wb=project(b.gx,b.gz+1,-1),eb=project(b.gx+1,b.gz,-1);const path=(pts,fill)=>{polys+=`<path fill="${fill}" d="M${pts.map(p=>`${f(p[0]-minX)} ${f(p[1]-minY)}`).join('L')}Z"/>`;};const front=blocks[(b.gz+1)*iconW+b.gx],right=b.gx+1<iconW?blocks[b.gz*iconW+b.gx+1]:null;if(!front||front.h<b.h)path([w,s,sb,wb],shade(c,.72));if(!right||right.h<b.h)path([s,e,eb,sb],shade(c,.58));path([n,e,s,w],shade(c,1));}
await writeFile('public/assets/voxel-creek.svg',`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f(maxX-minX)} ${f(maxY-minY)}">${polys}</svg>\n`);
const counts=Object.entries(MAT).map(([name,id])=>`${name} ${mat.filter(m=>m===id).length}`).join(', ');
console.log(`${cols}×${rows} world, ${route.length} route points, ${stops.length} stops\n${counts}`);
