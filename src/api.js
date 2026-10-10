import {uid} from './helpers.js';
const cfg=window.CNMI_CONFIG||{};
export const configured=!!(cfg.SUPABASE_URL&&cfg.SUPABASE_ANON_KEY);
export const demo=!configured&&cfg.ALLOW_DEMO===true;
const base=String(cfg.SUPABASE_URL||'').replace(/\/$/,'');
const key=String(cfg.SUPABASE_ANON_KEY||'');
let session=null;
export let profile=null;
const today=new Date();
const mkDate=(plus)=>new Date(today.getTime()+plus*86400000).toISOString();
const demoPatient={id:'p_demo_1',hn:'C0000001',first_name:'ผู้ป่วย',last_name:'ตัวอย่าง',date_of_birth:'1995-01-01',sex:'หญิง',ward:'OPD'};
const demoTasks=[
 {id:'demo_1',patient_id:'p_demo_1',patients:demoPatient,title:'ติดตาม LDPPC จากห้องจ่าย',details:'เวรเย็นโทรจอง LDPPC แล้ว เวรเช้าต้องไปรับและตรวจสอบความพร้อมใช้',category:'blood',work_mode:'ongoing',status:'open',due_at:mkDate(0),appointment_at:null,target_qty:2,progress_qty:1,product:'LDPPC',goal:'พร้อมใช้',created_at:mkDate(-1),handover_steps:[{id:'s_1',label:'โทรจอง LDPPC',is_done:true},{id:'s_2',label:'ไปรับ LDPPC',is_done:false},{id:'s_3',label:'ตรวจสอบพร้อมใช้',is_done:false}],handover_updates:[{id:'u1',action:'note',note:'โทรจองแล้ว รอไปรับ',created_at:mkDate(-1),actor_id:'demo',actor_name:'เจ้าหน้าที่ตัวอย่าง'}],handover_task_specimens:[{specimens:{id:'sp1',ln:'950000000001',patient_id:'p_demo_1'}}]},
 {id:'demo_2',patient_id:'p_demo_1',patients:demoPatient,title:'ตรวจสอบ Blood group ครั้งก่อน',details:'ตรวจสอบผล Blood group ของสิ่งส่งตรวจครั้งก่อน แยกจากครั้งปัจจุบัน',category:'lab',work_mode:'single',status:'open',due_at:mkDate(0),target_qty:null,progress_qty:0,created_at:mkDate(-1),handover_steps:[],handover_updates:[],handover_task_specimens:[{specimens:{id:'sp2',ln:'950000000002',patient_id:'p_demo_1'}}]},
 {id:'demo_3',patient_id:null,patients:null,title:'โทรติดตามห้อง Red Cell',details:'ติดตามเลือดแดงหายากตามวันนัดจากห้อง Red Cell',category:'coord',work_mode:'ongoing',status:'open',due_at:mkDate(2),target_qty:null,progress_qty:0,created_at:mkDate(0),handover_steps:[],handover_updates:[],handover_task_specimens:[]},
 {id:'demo_4',patient_id:'p_demo_1',patients:demoPatient,title:'เตรียมเลือดตามนัดเดิม',details:'บันทึกเก่าที่ปิดแล้ว',category:'blood',work_mode:'single',status:'done',due_at:mkDate(-30),target_qty:null,progress_qty:0,created_at:mkDate(-33),completed_at:mkDate(-30),handover_steps:[],handover_updates:[],handover_task_specimens:[]}
];
const demoPeople=[{id:'demo',email:'demo@mahidol.ac.th',full_name:'เจ้าหน้าที่ทดลอง',role:'admin',must_change_password:false,is_active:true}];
const getToken=()=>session?.access_token;
function headers(isJson=true){return {'apikey':key,...(isJson?{'Content-Type':'application/json'}:{}),...(getToken()?{'Authorization':`Bearer ${getToken()}`}:{})}}
async function request(path,{method='GET',body,headers:extra}={}){
 let res=await fetch(base+path,{method,headers:{...headers(),...(extra||{})},body:body===undefined?undefined:JSON.stringify(body),cache:'no-store'});
 if(res.status===401&&session?.refresh_token){try{await refresh();res=await fetch(base+path,{method,headers:{...headers(),...(extra||{})},body:body===undefined?undefined:JSON.stringify(body),cache:'no-store'})}catch{signOut()}}
 if(!res.ok){let m='เกิดข้อผิดพลาดจากเซิร์ฟเวอร์';try{const j=await res.json();m=j.message||j.error_description||j.error||j.details||m}catch{m=await res.text()||m}throw Error(`${m} (${res.status})`)}
 if(res.status===204)return null;
 const raw=await res.text();return raw?JSON.parse(raw):null;
}
async function refresh(){const s=await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:session.refresh_token}});setSession(s);return s}
function setSession(s){session=s;sessionStorage.setItem('cnmi_session',JSON.stringify(s))}
export async function init(){
 if(demo){profile=demoPeople[0];return profile}
 if(!configured)return null;
 try{
  const saved=JSON.parse(sessionStorage.getItem('cnmi_session')||'null');if(!saved)return null;
  session=saved;
  if(saved.expires_at&&saved.expires_at*1000<Date.now()+30000)await refresh();
  profile=await getMe();return profile;
 }catch{session=null;profile=null;sessionStorage.removeItem('cnmi_session');return null}
}
export async function signIn(username,password){
 if(demo){profile=demoPeople[0];return profile}
 const email=String(username).trim().replace(/@mahidol\.ac\.th$/i,'').toLowerCase()+'@mahidol.ac.th';
 const s=await request('/auth/v1/token?grant_type=password',{method:'POST',body:{email,password}});
 setSession(s);profile=await getMe();if(!profile?.is_active){signOut();throw Error('บัญชีนี้ถูกระงับการใช้งาน')};return profile;
}
export function signOut(){session=null;profile=null;sessionStorage.removeItem('cnmi_session')}
export function currentUser(){return profile}
export async function getMe(){if(demo)return demoPeople[0];const u=session?.user?.id;if(!u)return null;const p=await request(`/rest/v1/profiles?id=eq.${encodeURIComponent(u)}&select=*`);return p?.[0]||null}
export async function updatePassword(next){if(demo){profile={...profile,must_change_password:false};return}await request('/auth/v1/user',{method:'PUT',body:{password:next}});await request('/rest/v1/rpc/finish_first_login',{method:'POST',body:{}});profile=await getMe()}
const detailSelect='*,patients(*),handover_steps(*),handover_updates(*),handover_task_specimens(specimens(*))';
const deepCopy=x=>JSON.parse(JSON.stringify(x));
export async function getTasks(){if(demo)return deepCopy(demoTasks);return request(`/rest/v1/handover_tasks?status=eq.open&select=${encodeURIComponent(detailSelect)}&order=due_at.asc.nullslast&limit=500`)}
export async function getTask(id){if(demo)return deepCopy(demoTasks.find(t=>t.id===id)||null);const rows=await request(`/rest/v1/handover_tasks?id=eq.${encodeURIComponent(id)}&select=${encodeURIComponent(detailSelect)}`);return rows[0]||null}
export async function getProfiles(){if(demo)return deepCopy(demoPeople);return request('/rest/v1/profiles?select=id,email,full_name,role,must_change_password,is_active,created_at&order=full_name.asc')}
export async function getAudits(){if(demo)return[];return request('/rest/v1/audit_logs?select=id,table_name,record_id,action,actor_id,created_at&order=created_at.desc&limit=80')}
async function insert(table,data){const rows=await request(`/rest/v1/${table}`,{method:'POST',body:data,headers:{Prefer:'return=representation'}});return rows[0]}
export async function createTask(form){
 if(demo){const id=uid();const patient=form.hn?{id:uid(),hn:form.hn,first_name:form.first_name,last_name:form.last_name,date_of_birth:form.date_of_birth,sex:form.sex,ward:form.ward}:null;const t={id,patient_id:patient?.id||null,patients:patient,title:form.title,details:form.details,category:form.category,work_mode:form.work_mode,status:'open',due_at:form.due_at,appointment_at:form.appointment_at,target_qty:form.target_qty,progress_qty:0,product:form.product,goal:form.goal,created_at:new Date().toISOString(),handover_steps:(form.steps||[]).map(x=>({id:uid(),label:x,is_done:false})),handover_updates:[],handover_task_specimens:(form.lns||[]).map(ln=>({specimens:{id:uid(),ln}}))};demoTasks.unshift(t);return t}
 let patientId=null;
 if(form.hn){
  const found=await request(`/rest/v1/patients?hn=eq.${encodeURIComponent(form.hn)}&select=*`);
  if(found.length){
   const p=found[0];if(form.date_of_birth&&p.date_of_birth&&form.date_of_birth!==p.date_of_birth)throw Error('HN นี้มีวันเกิดในฐานข้อมูลไม่ตรงกัน กรุณาตรวจสอบผู้ป่วยก่อนบันทึก');
   patientId=p.id;
  }else{
   const p=await insert('patients',{hn:form.hn,first_name:form.first_name,last_name:form.last_name,date_of_birth:form.date_of_birth,sex:form.sex||null,ward:form.ward||null,created_by:profile.id});patientId=p.id;
  }
 }
 // Database function atomically creates task, specimens, and steps.
 const rows=await request('/rest/v1/rpc/create_handover',{method:'POST',body:{p_patient_id:patientId,p_title:form.title,p_details:form.details,p_category:form.category,p_work_mode:form.work_mode,p_due_at:form.due_at,p_appointment_at:form.appointment_at,p_target_qty:form.target_qty,p_product:form.product,p_goal:form.goal,p_lns:form.lns||[],p_steps:form.steps||[]}});
 return getTask(rows);
}
export async function addAction(id,{action='note',note='',next_due_at=null,qty_delta=0,ready_confirmed=false}={}){
 if(demo){const t=demoTasks.find(x=>x.id===id);if(!t)throw Error('ไม่พบงาน');if(action==='carry')t.due_at=next_due_at||t.due_at;if(action==='progress')t.progress_qty=(Number(t.progress_qty)||0)+Number(qty_delta||0);if(action==='complete'){if(t.handover_steps.some(s=>!s.is_done))throw Error('ยังมีขั้นตอนที่ยังไม่เสร็จ');if(t.target_qty!=null&&Number(t.progress_qty||0)<Number(t.target_qty))throw Error('จำนวนที่ดำเนินการยังไม่ครบ');t.status='done';t.completed_at=new Date().toISOString()}if(action==='cancel')t.status='cancelled';t.handover_updates.unshift({id:uid(),action,note,created_at:new Date().toISOString(),actor_id:profile.id,actor_name:profile.full_name,next_due_at,qty_delta});return deepCopy(t)}
 await request('/rest/v1/rpc/apply_handover_action',{method:'POST',body:{p_task_id:id,p_action:action,p_note:note,p_next_due_at:next_due_at,p_qty_delta:qty_delta,p_ready_confirmed:ready_confirmed}});return getTask(id);
}
export async function setStep(id,stepId,done){if(demo){const t=demoTasks.find(x=>x.id===id),s=t?.handover_steps.find(x=>x.id===stepId);if(!s)throw Error('ไม่พบขั้นตอน');s.is_done=done;s.done_at=done?new Date().toISOString():null;return deepCopy(t)}await request('/rest/v1/rpc/set_handover_step',{method:'POST',body:{p_step_id:stepId,p_done:done}});return getTask(id)}
export async function addStep(id,label){if(demo){const t=demoTasks.find(x=>x.id===id);t.handover_steps.push({id:uid(),label,is_done:false});return deepCopy(t)}await request('/rest/v1/rpc/add_handover_step',{method:'POST',body:{p_task_id:id,p_label:label}});return getTask(id)}
export async function adminUser({op,email,password,full_name,user_id}){
 if(demo){
  if(op==='health')return {ok:false,message:'โหมดทดลอง — ยังไม่สามารถรีเซ็ตรหัสจริงได้ ต้องเชื่อม Supabase'};
  if(op==='create'){const p={id:uid(),email,full_name,role:'staff',must_change_password:true,is_active:true};demoPeople.push(p);return p}
  return {ok:true};
 }
 try{
  return await request('/functions/v1/admin-user',{method:'POST',body:{op,email,password,full_name,user_id}});
 }catch(e){
  const m=String(e?.message||'');
  if(m.includes('(404)'))throw Error('ไม่พบ Edge Function admin-user (404) — ต้อง Deploy ฟังก์ชันใน Supabase Project ที่แอปเชื่อมอยู่ก่อน');
  if(m.includes('(401)'))throw Error('ยืนยันตัวตนไม่สำเร็จ (401) — กรุณาออกจากระบบแล้ว Login ใหม่ และตรวจสอบการตั้งค่า Edge Function');
  if(m.includes('(403)'))throw Error('ไม่มีสิทธิ์หรือโดเมนยังไม่อนุญาต (403) — ตรวจสอบบัญชี Admin และ Secret ALLOWED_ORIGINS ใน Supabase');
  if(m.includes('Failed to fetch')||m.includes('NetworkError')||m.includes('Load failed'))throw Error('ติดต่อ Edge Function ไม่ได้ — ตรวจสอบว่า Deploy แล้ว และเพิ่ม URL เว็บไซต์ใน ALLOWED_ORIGINS (ไม่ต้องใส่ / ท้ายโดเมน)');
  throw e;
 }
}
export async function searchTasks(q,dob){
 if(demo){const search=String(q||'').toLowerCase();return deepCopy(demoTasks.filter(t=>{
 const p=t.patients;const searchable=[p?.hn,p?.first_name,p?.last_name,t.title,t.details,...(t.handover_task_specimens||[]).map(x=>x.specimens?.ln)].join(' ').toLowerCase();return(!search||searchable.includes(search))&&(!dob||p?.date_of_birth===dob)
 }))}
 const ids=await request('/rest/v1/rpc/search_handover_history',{method:'POST',body:{p_query:q||'',p_dob:dob||null}});
 if(!ids?.length)return[];
 const names=ids.slice(0,100).map(x=>x.task_id).filter(Boolean);
 if(!names.length)return[];
 return request(`/rest/v1/handover_tasks?id=in.(${names.join(',')})&select=${encodeURIComponent(detailSelect)}&order=created_at.desc`);
}
