export const esc=(s)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const $=(s,root=document)=>root.querySelector(s);
export const $$=(s,root=document)=>[...root.querySelectorAll(s)];
export const TH_ZONE='Asia/Bangkok';
export function thDate(v){if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?'—':new Intl.DateTimeFormat('th-TH',{timeZone:TH_ZONE,day:'numeric',month:'short',year:'numeric'}).format(d)}
export function thTime(v){if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?'—':new Intl.DateTimeFormat('th-TH',{timeZone:TH_ZONE,dateStyle:'medium',timeStyle:'short'}).format(d)}
export function formatInputLocal(value){const d=new Date(value||Date.now()); const parts=new Intl.DateTimeFormat('en-CA',{timeZone:TH_ZONE,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(d);let o={};for(const p of parts)o[p.type]=p.value;return `${o.year}-${o.month}-${o.day}T${o.hour}:${o.minute}`}
export function tomorrowDefault(){const now=new Date();return formatInputLocal(new Date(now.getTime()+86400000))}
export function toUTC(local){return local?new Date(local).toISOString():null}
export function parseDob(v){const m=String(v||'').trim().match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);if(!m)return v||null;let y=+m[3];if(y>2400)y-=543;const d=new Date(Date.UTC(y,+m[2]-1,+m[1]));if(d.getUTCFullYear()!==y||d.getUTCMonth()!==+m[2]-1||d.getUTCDate()!==+m[1])return null;return `${y}-${String(m[2]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`}
export function dateDob(v){if(!v)return '—';const [y,m,d]=v.split('-');return `${d}/${m}/${Number(y)+543}`}
export function toast(message,bad=false){let el=document.getElementById('toast');if(!el){el=document.createElement('div');el.id='toast';document.body.append(el)}el.className=`toast ${bad?'bad':''}`;el.textContent=message;el.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.hidden=true,4100)}
export function uid(){return crypto.randomUUID?.()||('id'+Date.now()+Math.random().toString(36).slice(2))}
export const categoryLabels={blood:'จัดหา / เตรียมเลือด',lab:'ผลตรวจ / Blood group',donor:'ผู้บริจาค',coord:'ติดต่อประสานงาน',other:'อื่น ๆ'};
export function newElement(html){const t=document.createElement('template');t.innerHTML=html.trim();return t.content.firstElementChild}
