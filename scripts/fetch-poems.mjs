// Builds src/data/poems.json. Poem text is always taken from the named online source, never typed in.
// Only poems out of copyright in the US carry text. Others are linkOnly until the poet gives permission.
import {writeFile} from 'node:fs/promises';
const UA={headers:{'User-Agent':'Mozilla/5.0 (Egans Creek atlas poem fetch)'}};
const gutenberg=id=>`https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`;
const page=id=>`https://www.gutenberg.org/cache/epub/${id}/pg${id}-images.html`;
const wiki=title=>`https://en.wikisource.org/wiki/${encodeURI(title.replaceAll(' ','_'))}`;
const WHITMAN=1322,DICKINSON=12242,LANIER=579,TENNYSON=8601,HIAWATHA=19,CARROLL=12,FROST=58611;
const butterflies=['49150','49766','51536','68232','48662','48505','67435','1650171','58586','60551','49133'];
const grassSnakes=['27137','28362','558951','29200'];
const poems=[
 {id:'tide-rises',title:'The Tide Rises, the Tide Falls',poet:'Henry Wadsworth Longfellow',published:1880,wiki:'Ultima Thule/The Tide Rises, the Tide Falls',start:'The tide rises, the tide falls,',end:'And the tide rises, the tide falls.',last:true,url:'https://poets.org/poem/tide-rises-tide-falls',targets:{'chapter:tides':'The tide rises, the tide falls'}},
 {id:'marshes-of-glynn',title:'The Marshes of Glynn',poet:'Sidney Lanier',published:1878,book:LANIER,start:'Glooms of the live-oaks, beautiful-braided and woven',end:'marvellous marshes of Glynn',url:wiki('Hymns of the Marshes/The Marshes of Glynn'),targets:{'chapter:marsh':'marsh-grass','species:772903':'marsh-grass'}},
 {id:'in-memoriam',title:'In Memoriam A.H.H., Canto CXXI (CXXIII in most editions)',poet:'Alfred, Lord Tennyson',published:1850,excerpt:true,wiki:'In Memoriam (Tennyson)/Canto 121',start:'There rolls the deep where grew the tree.',end:'I cannot think the thing farewell.',stanza:4,url:wiki('In Memoriam (Tennyson)/Canto 121'),targets:{'chapter:formation':'There rolls the deep where grew the tree'}},
 {id:'fabliau',title:'Fabliau of Florida',poet:'Wallace Stevens',published:1923,wiki:'Harmonium (Stevens)/Fabliau of Florida',start:'Barque of phosphor',end:'To this droning of the surf.',url:wiki('Harmonium (Stevens)/Fabliau of Florida'),targets:{'place:coast':'On the palmy beach'}},
 {id:'inversnaid',title:'Inversnaid',poet:'Gerard Manley Hopkins',published:1918,wiki:'Poems of Gerard Manley Hopkins/Inversnaid',start:'This darksome burn, horseback brown,',end:'Long live the weeds and the wilderness yet.',stanza:4,url:wiki('Poems of Gerard Manley Hopkins/Inversnaid'),targets:{'chapter:history':'Of wet and of wildness'}},
 {id:'rivers',title:'The Negro Speaks of Rivers',poet:'Langston Hughes',published:1921,wiki:'The Weary Blues (collection)/The Negro Speaks of Rivers',start:"I've known rivers:",end:'My soul has grown deep like the rivers.',last:true,url:'https://poets.org/poem/negro-speaks-rivers',targets:{'place:river':"I've known rivers"}},
 {id:'creek-light',title:'Creek Light',poet:'Lola Haskins',published:2011,linkOnly:true,url:'https://rattle.com/creek-light-by-lola-haskins',targets:{'chapter:map':'Creek Light'}},
 {id:'song-of-myself-1',title:'Song of Myself, Section 1',poet:'Walt Whitman',published:1855,excerpt:true,book:WHITMAN,after:'Song of Myself',start:'       1',skipStart:true,before:'       2',reflow:true,url:page(WHITMAN),targets:{'species:773004':'a spear of summer grass'}},
 {id:'song-of-myself-33',title:'Song of Myself, Section 33',poet:'Walt Whitman',published:1855,excerpt:true,book:WHITMAN,after:'Song of Myself',start:'       33',skipStart:true,before:'       34',reflow:true,url:page(WHITMAN),targets:{'species:yellow-crown':'yellow-crown’d heron','species:26159':'the alligator in his tough pimples','species:53491':'the rattlesnake suns his flabby length','species:555974':'small crabs'}},
 {id:'our-old-feuillage',title:'Our Old Feuillage',poet:'Walt Whitman',published:1860,book:WHITMAN,after:'Our Old Feuillage',start:'  Always our old feuillage!',before:'BOOK XI',reflow:true,url:page(WHITMAN),targets:{'species:snowy':'snowy herons','species:58530':'two little yellow butterflies'}},
 {id:'magnet-south',title:'O Magnet-South',poet:'Walt Whitman',published:1860,book:WHITMAN,after:'O Magnet-South',start:'  O magnet-south! O glistening perfumed South! my South!',before:'Mannahatta',reflow:true,url:page(WHITMAN),targets:{'species:41663':'the raccoon','species:47902':'The cactus guarded with thorns'}},
 {id:'patient-spider',title:'A Noiseless Patient Spider',poet:'Walt Whitman',published:1868,book:WHITMAN,after:'A Noiseless Patient Spider',start:'  A noiseless patient spider,',end:'Till the gossamer thread you fling catch somewhere, O my soul.',reflow:true,url:'https://poets.org/poem/noiseless-patient-spider',targets:{'species:67707':'noiseless patient spider'}},
 {id:'hiawatha-intro',title:'The Song of Hiawatha, Introduction',poet:'Henry Wadsworth Longfellow',published:1855,excerpt:true,book:HIAWATHA,start:'Should you ask me, whence these stories?',before:'I',url:page(HIAWATHA),targets:{'species:great-blue':'The blue heron, the Shuh-shuh-gah'}},
 {id:'two-voices',title:'The Two Voices',poet:'Alfred, Lord Tennyson',published:1842,excerpt:true,book:TENNYSON,start:'To which the voice did urge reply;',end:'A living flash of light he flew',url:page(TENNYSON),targets:{'species:61495':'dragon-fly'}},
 {id:'walrus',title:'The Walrus and the Carpenter',poet:'Lewis Carroll',published:1871,book:CARROLL,start:'“The sun was shining on the sea,',end:'They’d eaten every one.”',url:page(CARROLL),targets:{'species:47585':'Oysters'}},
 {id:'two-look',title:'Two Look at Two',poet:'Robert Frost',published:1923,book:FROST,start:'TWO LOOK AT TWO',skipStart:true,before:'NOT TO KEEP',url:page(FROST),targets:{'species:42223':'doe'}},
 {id:'butterflys-day',title:'The Butterfly’s Day',poet:'Emily Dickinson',published:1891,book:DICKINSON,start:'From cocoon forth a butterfly',end:'Extinguished in its sea.',url:page(DICKINSON),targets:Object.fromEntries(butterflies.map(id=>[`species:${id}`,'butterfly']))},
 {id:'narrow-fellow',title:'The Snake (“A narrow fellow in the grass”)',poet:'Emily Dickinson',published:1866,book:DICKINSON,start:'A narrow fellow in the grass',end:'And zero at the bone.',url:page(DICKINSON),targets:Object.fromEntries(grassSnakes.map(id=>[`species:${id}`,'A narrow fellow in the grass']))},
 {id:'im-nobody',title:'I’m Nobody! Who Are You?',poet:'Emily Dickinson',published:1891,book:DICKINSON,start:"I'm nobody!  Who are you?",end:'To an admiring bog!',url:page(DICKINSON),targets:{'species:65979':'like a frog'}},
 {id:'toad',title:'A Toad Can Die of Light',poet:'Emily Dickinson',published:1896,book:DICKINSON,start:'A toad can die of light!',end:'Is large as thine.',url:page(DICKINSON),targets:{'species:64988':'A toad can die of light'}}
];
const decode=s=>s.replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16))).replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/​/g,'');
const cache=new Map();
function load(url,parse){if(!cache.has(url))cache.set(url,fetch(url,UA).then(r=>{if(!r.ok)throw Error(`${url}: HTTP ${r.status}`);return parse(r);}));return cache.get(url);}
const bookLines=id=>load(gutenberg(id),async r=>(await r.text()).replaceAll('\r','').split('\n'));
const wikiLines=title=>load('https://en.wikisource.org/w/api.php?action=parse&format=json&prop=text&redirects=1&page='+encodeURIComponent(title),async r=>{const html=(await r.json()).parse.text['*'];return decode(html.replace(/<style[\s\S]*?<\/style>/g,'').replace(/<br\s*\/?>/g,'\n').replace(/<\/(p|div|dd|li|tr)>/g,'\n').replace(/<[^>]+>/g,'')).split('\n').map(l=>l.trimEnd());});
function cut(lines,p){
 const same=(line,want)=>line.trim()===want.trim();
 const from=p.after?lines.findIndex(l=>same(l,p.after)):0;if(from<0)throw Error(`${p.id}: no "${p.after}"`);
 const start=lines.findIndex((l,i)=>i>=from&&same(l,p.start));if(start<0)throw Error(`${p.id}: no start`);
 let end=-1;
 if(p.before){end=lines.findIndex((l,i)=>i>start&&same(l,p.before));if(end<0)throw Error(`${p.id}: no end`);end--;}
 else if(p.last){for(let i=lines.length-1;i>start;i--)if(lines[i].includes(p.end)){end=i;break;}if(end<0)throw Error(`${p.id}: no end`);}
 else{end=lines.findIndex((l,i)=>i>=start&&l.includes(p.end));if(end<0)throw Error(`${p.id}: no end`);}
 return lines.slice(p.skipStart?start+1:start,end+1);
}
function shape(raw,p){
 let lines=raw.map(l=>l.trimEnd().replace(/_/g,''));
 if(p.reflow)lines=lines.reduce((out,l)=>{if(/^ {6}\S/.test(l)&&out.length)out[out.length-1]+=' '+l.trim();else out.push(l);return out;},[]);
 if(p.stanza){const body=lines.filter(l=>l.trim());lines=body.flatMap((l,i)=>i&&i%p.stanza===0?['',l]:[l]);}
 const indent=Math.min(...lines.filter(l=>l.trim()).map(l=>l.match(/^ */)[0].length));
 return lines.map(l=>l.slice(indent)).join('\n').replace(/\n{3,}/g,'\n\n').trim();
}
const out=[];
for(const {book,wiki:page,after,start,before,end,last,skipStart,reflow,stanza,...p} of poems){
 const check=await fetch(p.url,UA);if(!check.ok)throw Error(`${p.id}: ${p.url} returned HTTP ${check.status}`);
 if(p.linkOnly){out.push(p);continue;}
 const lines=book?await bookLines(book):await wikiLines(page);
 const text=shape(cut(lines,{id:p.id,after,start,before,end,last,skipStart}),{reflow,stanza});
 for(const phrase of Object.values(p.targets))if(!text.toLowerCase().includes(phrase.toLowerCase()))throw Error(`${p.id}: phrase not in text: ${phrase}`);
 out.push({...p,text,source:book?gutenberg(book):wiki(page)});
}
await writeFile(new URL('../src/data/poems.json',import.meta.url),JSON.stringify({retrieved:new Date().toISOString().slice(0,10),poems:out},null,1)+'\n');
console.log(out.map(p=>`${p.id}: ${p.linkOnly?'link only':p.text.split('\n').length+' lines'}`).join('\n'));
