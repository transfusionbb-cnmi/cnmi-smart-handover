// CNMI Smart Handover: no automatic cloud speech recognition.
// First try browser-provided on-device recognition (if truly local + Thai pack exists).
// Otherwise focus text field and instruct how to use the device's own keyboard dictation.
export function deviceVoiceGuide(ua='', platform='') {
  if (/iPhone|iPad|iPod/i.test(ua) || (platform==='MacIntel' && /Mac/i.test(ua) && /Mobile/i.test(ua))) {
    return {kind:'ios',title:'พูดด้วยแป้นพิมพ์ iPhone / iPad',steps:'แตะช่องข้อความ → กดรูปไมโครโฟนบนแป้นพิมพ์ → พูด → ตรวจข้อความ',note:'ถ้าไม่เห็นไมค์ ให้เปิด การตั้งค่า → ทั่วไป → แป้นพิมพ์ → เปิดใช้การป้อนตามคำบอก'};
  }
  if (/Android/i.test(ua)) {
    return {kind:'android',title:'พูดด้วย Android',steps:'แตะช่องข้อความ → กดไมโครโฟนบน Gboard หรือแป้นพิมพ์ที่ใช้อยู่ → พูด',note:'ต้องเปิดการพิมพ์ด้วยเสียงที่แป้นพิมพ์ของเครื่องก่อน'};
  }
  if (/Windows/i.test(ua) || /Win/i.test(platform)) {
    return {kind:'windows',title:'พูดด้วย Windows',steps:'คลิกช่องข้อความ แล้วกด Windows + H เพื่อเริ่มพูด ถ้าเครื่องรองรับภาษาไทย',note:'Windows รุ่นและการตั้งค่าภาษาอาจรองรับต่างกัน โดยเฉพาะ Windows 10'};
  }
  if (/Mac/i.test(ua) || /Mac/i.test(platform)) {
    return {kind:'mac',title:'พูดด้วย Mac',steps:'คลิกช่องข้อความ แล้วใช้ Dictation จากการตั้งค่า Keyboard ของ Mac',note:'ตรวจภาษาและการตั้งค่า Dictation ก่อนใช้งาน'};
  }
  return {kind:'other',title:'พูดด้วยแป้นพิมพ์ของอุปกรณ์',steps:'แตะช่องข้อความ แล้วกดไมโครโฟนจากแป้นพิมพ์ที่รองรับ',note:'ตรวจสอบว่าตั้งค่าการพิมพ์ด้วยเสียงเรียบร้อย'};
}
export function appendVoiceText(existing,recognized){
  const clean=String(recognized||'').trim();
  if(!clean)return String(existing||'');
  const previous=String(existing||'');
  return previous.trim()?previous.replace(/\s*$/,'')+' '+clean:clean;
}
function addToField(field,recognized){
  if(!field?.isConnected)return;
  field.value=appendVoiceText(field.value,recognized);
  field.dispatchEvent(new Event('input',{bubbles:true}));
  field.focus();
}
export function attachVoiceInput({field,button,message,panel,signal}){
  if(!field||!button||!message||!panel)return;
  const guide=deviceVoiceGuide(navigator.userAgent||'',navigator.platform||'');
  let active=null;
  const update=(s)=>{if(message.isConnected)message.textContent=s};
  const help=(extra='')=>{
    if(!panel.isConnected)return;
    panel.classList.remove('hide');
    panel.innerHTML=`<strong>${guide.title}</strong><p>${guide.steps}</p><p class="hint">${guide.note}</p>${extra?`<p class="voice-status">${extra}</p>`:''}<p class="hint">การพิมพ์ด้วยเสียงของระบบปฏิบัติการอาจใช้อินเทอร์เน็ต โปรดใช้งานตามนโยบายข้อมูลผู้ป่วยของโรงพยาบาล และตรวจทานข้อความทุกครั้ง</p>`;
  };
  const reset=()=>{active=null;if(button.isConnected){button.textContent='🎤 พูดแทนการพิมพ์';button.classList.remove('recording')}};
  const startRecognition=(Speech)=>{
    let recognizer;
    try{
      recognizer=new Speech();
      // Enforce local-only. If local recognition is unavailable, do not fall back to cloud.
      recognizer.processLocally=true;
      recognizer.lang='th-TH';
      recognizer.interimResults=false;
      recognizer.continuous=false;
      recognizer.maxAlternatives=1;
      recognizer.onresult=(event)=>{
        const heard=Array.from(event.results||[]).filter(r=>r.isFinal).map(r=>r[0]?.transcript||'').join(' ');
        addToField(field,heard);
        if(heard)update('เติมข้อความแล้ว กรุณาตรวจทานก่อนบันทึก');
      };
      recognizer.onerror=(event)=>{
        update(`ใช้ไมโครโฟนในเบราว์เซอร์ไม่ได้ (${event.error||'ไม่ทราบสาเหตุ'})`);
        help('ยังใช้ไมโครโฟนบนแป้นพิมพ์ได้ หากอุปกรณ์รองรับ');
      };
      recognizer.onend=()=>{reset();};
      recognizer.start();active=recognizer;
      button.textContent='■ หยุดฟัง';button.classList.add('recording');
      update('กำลังฟังภาษาไทยในเครื่อง…');
      help('โหมดนี้ใช้การถอดเสียงในเครื่องเท่านั้น ไม่ส่งเสียงไป API ของแอป');
      return true;
    }catch(e){reset();update('ไม่สามารถเริ่มถอดเสียงในเครื่องได้');help();return false;}
  };
  const tryLocal=async()=>{
    const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!Speech || !('processLocally' in Speech.prototype) || typeof Speech.available!=='function')return false;
    let availability;
    try{availability=await Speech.available({langs:['th-TH'],processLocally:true})}catch{return false}
    if(signal?.aborted)return true;
    if(availability==='available')return startRecognition(Speech);
    if(availability==='downloadable'){
      update('ภาษาไทยยังไม่ได้ติดตั้งสำหรับถอดเสียงในเครื่อง');
      help('ดาวน์โหลดโมเดลภาษาไทยลงเบราว์เซอร์ได้เมื่อเบราว์เซอร์รองรับ');
      const install=document.createElement('button');
      install.className='btn small outline voice-install';install.type='button';
      install.textContent='ติดตั้งภาษาไทยสำหรับถอดเสียงในเครื่อง';
      panel.appendChild(install);
      install.onclick=async()=>{
        install.disabled=true;install.textContent='กำลังตรวจสอบและติดตั้ง…';
        try{
          const result=await Speech.install({langs:['th-TH'],processLocally:true});
          if(signal?.aborted)return;
          if(result){update('ติดตั้งสำเร็จ กดพูดอีกครั้ง');help('ภาษาไทยพร้อมสำหรับการถอดเสียงภายในเครื่อง');}
          else{update('เบราว์เซอร์ยังไม่รองรับภาษาไทยแบบในเครื่อง');help()}
        }catch{update('ติดตั้งภาษาไทยไม่ได้ในเบราว์เซอร์นี้');help()}
      };
      return true;
    }
    return false;
  };
  button.addEventListener('click',async()=>{
    if(active){try{active.stop()}catch{} reset();update('หยุดฟังแล้ว กรุณาตรวจทานข้อความ');return}
    // Focusing a textarea from the user's click lets the native iOS/Android keyboard appear.
    field.focus();
    help();update('กำลังตรวจสอบไมโครโฟนของเบราว์เซอร์…');button.disabled=true;
    try{
      const local=await tryLocal();
      if(!local){update('พร้อมพูดด้วยไมโครโฟนบนแป้นพิมพ์ / ปุ่มลัดของเครื่อง');help()}
    }finally{if(button.isConnected)button.disabled=false}
  });
  signal?.addEventListener('abort',()=>{try{active?.abort()}catch{}reset()},{once:true});
}
