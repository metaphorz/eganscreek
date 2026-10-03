import {clamp} from './science.js';
export function birdArt(b,{small=false,juvenile=false}={}){
 const white=juvenile&&b.id==='little-blue';const fill=white?'#f5f3e7':b.fill==='white'?'#f5f3e7':b.fill;
 const compact=['green','black-crown','yellow-crown','cattle','ibis'].includes(b.id);
 const neck=compact?'M149 137 Q178 125 176 113 Q162 99 182 92':'M149 137 C202 124 165 118 168 103 C171 88 183 78 189 74';
 const hx=compact?183:190,hy=compact?91:74;
 const bill=b.id==='ibis'?`<path d="M${hx+8} ${hy} Q234 ${hy+4} 230 ${hy+48} Q223 ${hy+17} ${hx+8} ${hy+6}" fill="${b.bill}"/>`:b.id==='spoonbill'?`<path d="M${hx+6} ${hy} L227 ${hy+1} Q252 ${hy-7} 251 ${hy+6} Q247 ${hy+17} 225 ${hy+8} L${hx+6} ${hy+6}" fill="${b.bill}"/>`:`<path d="M${hx+6} ${hy-3} L${hx+48} ${hy+4} L${hx+6} ${hy+7}Z" fill="${b.bill}"/>`;
 const leg=['ibis','spoonbill'].includes(b.id)?'#b47465':b.id==='snowy'?'#414b42':'#7f805d';
 return `<svg viewBox="0 0 320 260" class="bird-art ${small?'small':''}" role="img" aria-label="Original stylized illustration of ${b.name}${white?', white juvenile':''}"><ellipse cx="153" cy="232" rx="87" ry="5" fill="#476258" opacity=".09"/><g transform="translate(${(1-b.scale)*155} ${(1-b.scale)*225}) scale(${b.scale})"><path d="M137 162 L140 204 L128 228 M163 162 L163 196 L183 224" fill="none" stroke="${leg}" stroke-width="3.5" stroke-linecap="round"/><path d="M128 228 l-14 2 m14-2 l10 3 M183 224 l14 1 m-14-1 l-7 5" stroke="${b.id==='snowy'?'#dcb943':leg}" stroke-width="3" fill="none"/><path d="M103 136 L69 159 L104 157" fill="${fill}"/><ellipse cx="131" cy="144" rx="43" ry="28" fill="${fill}" stroke="#344b42" stroke-opacity=".12"/><path d="M109 126 Q153 120 164 153 Q140 169 99 151Z" fill="${b.id==='stork'?'#2c3835':b.id==='black-crown'?'#3b4947':fill}" stroke="#344b42" stroke-opacity=".17"/>
 <path d="${neck}" fill="none" stroke="#718175" stroke-opacity=".45" stroke-width="${compact?22:17}" stroke-linecap="round"/><path d="${neck}" fill="none" stroke="${['green','great-blue'].includes(b.id)?'#a99c83':b.id==='little-blue'&&!white?'#6e647d':fill}" stroke-width="${compact?20:15}" stroke-linecap="round"/>
 <ellipse cx="${hx}" cy="${hy}" rx="15" ry="10" stroke="#627568" stroke-opacity=".35" stroke-width="1" fill="${b.id==='stork'?'#62685e':fill}"/>${bill}
 ${['black-crown','green','great-blue','yellow-crown'].includes(b.id)?`<path d="M${hx-13} ${hy-3} Q${hx} ${hy-17} ${hx+12} ${hy-3}" fill="${b.id==='yellow-crown'?'#d9d4b6':'#314942'}"/>`:''}
 ${b.id==='cattle'?`<path d="M174 88 Q188 78 196 90 L187 93Z" fill="#cda771"/>`:''}
 ${b.id==='tricolored'?'<path d="M109 158 Q142 175 163 150 Q153 184 116 167Z" fill="#f2eddd"/>':''}
 <circle cx="${hx+5}" cy="${hy-1}" r="2.7" fill="#d9bb58"/><circle cx="${hx+5}" cy="${hy-1}" r="1.3" fill="#273931"/>
 <path d="M102 143 Q135 161 155 143 M107 138 Q137 154 155 140" fill="none" stroke="#344b42" opacity=".16" stroke-width="1"/></g></svg>`;
}
const rand=n=>{const x=Math.sin(n*91.71+17)*43758.545;return x-Math.floor(x);};
export function grass(x,y,s=1,tone='#626b3e',seed=0){let paths='';for(let j=0;j<8;j++){const dx=(rand(seed+j)-.5)*58*s,h=(24+rand(seed+j+20)*44)*s;paths+=`<path d="M${x} ${y} Q${x+dx*.4} ${y-h*.62} ${x+dx} ${y-h}"/>`;}return `<g stroke="${tone}" stroke-width="${1.5*s}" fill="none" opacity=".88">${paths}</g>`;}
export function marshScene({id='scene',level=.45,season='fall'}={}){
 const grassColor={spring:'#6c864e',summer:'#70814a',fall:'#99915b',winter:'#98876a'}[season];
 let far='',near='',ripples='';
 for(let i=0;i<150;i++){const x=i*8;const y=270+Math.sin(i*.12)*8;far+=grass(x,y,.32,grassColor,i);}
 for(let i=0;i<80;i++){const x=i<40?i*10:850+(i-40)*10;const y=365+rand(i)*125;near+=grass(x,y,.65+rand(i)*.65,grassColor,i+100);}
 for(let i=0;i<45;i++){let x=rand(i+50)*1200,y=310+rand(i+60)*220; ripples+=`<path d="M${x} ${y}h${12+rand(i)*70}" stroke="#d4e1da" opacity="${.15+rand(i)*.25}"/>`;}
 const waterY=340-level*65;
 return `<svg id="${id}" class="marsh-scene" viewBox="0 0 1200 540" preserveAspectRatio="xMaxYMid slice" role="img" aria-label="Illustrative tidal marsh; move the tide control to change water level. Not a surveyed section.">
 <defs><linearGradient id="${id}-sky" x2="0" y2="1"><stop stop-color="#cbd8d6"/><stop offset="1" stop-color="#f3ead5"/></linearGradient><linearGradient id="${id}-water" x2="0.3" y2="1"><stop stop-color="#8fa8a4"/><stop offset="1" stop-color="#557f80"/></linearGradient><linearGradient id="${id}-land" x2="0" y2="1"><stop stop-color="#a8a078"/><stop offset="1" stop-color="#6c7652"/></linearGradient><clipPath id="${id}-clip"><path d="M0 295 Q140 275 250 300 Q370 330 545 293 Q660 270 790 298 Q950 350 1200 282 V540 H0Z"/></clipPath></defs>
 <rect width="1200" height="540" fill="url(#${id}-sky)"/><circle cx="920" cy="116" r="45" fill="#f9f1d9" opacity=".85"/>
 <path d="M0 234 Q40 205 73 229 Q100 166 132 209 Q153 189 180 224 Q205 184 240 232 Q269 204 296 237 L1200 247 V288 H0Z" fill="#798879" opacity=".4"/>
 <path d="M0 260 Q46 227 87 253 Q115 213 154 247 Q186 223 220 255 Q245 235 293 264 L1200 264 V302 H0Z" fill="#566d5d" opacity=".72"/>
 <path d="M0 274 Q170 251 320 274 Q420 287 544 274 Q740 250 950 277 L1200 269 V540 H0Z" fill="url(#${id}-land)"/>
 ${far}<path d="M640 277 C554 304 722 309 606 336 C560 353 366 359 439 399 C475 422 723 414 771 456 C796 482 689 517 650 540 L265 540 C369 490 500 480 523 455 C538 437 276 421 291 386 C306 351 521 334 556 321 C605 304 510 299 601 277Z" fill="#9cb2ac"/>
 <g clip-path="url(#${id}-clip)"><rect class="water-plane" x="0" y="${waterY}" width="1200" height="540" fill="url(#${id}-water)" opacity=".78"/>${ripples}</g>
 <path d="M0 370 Q87 347 211 397 Q300 423 352 540 H0Z M1200 350 Q1030 369 934 423 Q893 464 901 540 H1200Z" fill="#7b7d50"/>
 ${near}<g class="scene-bird" transform="translate(785 ${255-level*30}) scale(.57)"><path d="M95 182 L94 261 L78 266 M118 182 L127 232 L148 258" fill="none" stroke="#3d5047" stroke-width="4"/><ellipse cx="106" cy="166" rx="35" ry="23" fill="#f7f5e8"/><path d="M118 159 C186 148 127 133 138 104 Q144 86 160 85" fill="none" stroke="#f7f5e8" stroke-width="13" stroke-linecap="round"/><ellipse cx="162" cy="85" rx="13" ry="8" fill="#f7f5e8"/><path d="M173 83 L216 90 L173 91" fill="#d1ac59"/><circle cx="166" cy="83" r="2" fill="#334b3e"/></g>
 <path d="M338 140 q14-13 26 0 q13-10 23 2 M390 163 q9-9 18 0 q8-8 16 1" fill="none" stroke="#5e756c" stroke-width="2"/>
 <text x="32" y="505" fill="#f4eedc" font-family="Georgia" font-size="15" letter-spacing="2">Egans Creek / AMELIA ISLAND</text></svg>`;
}
export function updateScene(el,level){el.querySelector('.water-plane')?.setAttribute('y',340-clamp(level)*65);el.querySelector('.scene-bird')?.setAttribute('transform',`translate(${785+clamp(level)*45} ${255-clamp(level)*30}) scale(.57)`);}
