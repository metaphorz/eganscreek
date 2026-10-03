import {sources} from './data/content.js';
export const $=(s,r=document)=>r.querySelector(s);
export const $$=(s,r=document)=>[...r.querySelectorAll(s)];
export const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const evidence=(...keys)=>`<div class="evidence"><span>Evidence & further reading</span>${keys.map(k=>`<a href="${sources[k].url}" target="_blank" rel="noopener">${sources[k].author} ↗</a>`).join('')}</div>`;
export const heading=(n,label,title,description)=>`<div class="chapter-heading"><div><p class="eyebrow">${n} / ${label}</p><h1>${title}</h1></div><p class="chapter-intro">${description}</p></div>`;
export function toast(message){const el=$('#toast');el.textContent=message;el.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.hidden=true,4500);}
export function download(name,content,type='application/json'){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function openDialog(title,html){const d=$('#dialog');$('#dialog-title').textContent=title;$('#dialog-body').innerHTML=html;d.showModal();return d;}
export function setupRange(root,selector,fn){const el=$(selector,root);el.addEventListener('input',()=>fn(Number(el.value)));return el;}
