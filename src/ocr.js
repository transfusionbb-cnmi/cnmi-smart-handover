// OCR stays in browser memory; images are not automatically uploaded.
// OCR worker/trained models are CDN assets. Do NOT enable before source approval.
export function extractLISFields(raw){
 const t=String(raw||'').replace(/\r/g,'');
 const take=(re)=>t.match(re)?.[1]?.trim()||'';
 const hn=take(/(?:HN\s*\/?\s*SID|HN)\s*[:：]?\s*(C\s*\d{5,9})/i).replace(/\s/g,'') || take(/\b(C\d{6,9})\b/i);
 const ln=take(/\bLN\s*[:：]?\s*(\d{9,16})/i) || take(/\b(\d{11,16})\b/);
 let date=take(/(?:Date\s*of\s*Birth|DOB|วันเกิด)\s*[:：]?\s*(\d{1,2}\s*[\/-]\s*\d{1,2}\s*[\/-]\s*\d{4})/i);
 date=date.replace(/\s/g,'');
 // LIS screens show BOTH Male and Female labels. OCR text alone cannot tell which radio is selected.
 const sex=/(?:เพศ\s*[:：]\s*หญิง|Gender\s*[:：]\s*Female(?![^\n]*Male))/i.test(t)?'หญิง':/(?:เพศ\s*[:：]\s*ชาย|Gender\s*[:：]\s*Male(?![^\n]*Female))/i.test(t)?'ชาย':'';
 const first=take(/(?:ชื่อ|First\s*name)\s*[:：]?\s*([^\n\t ]{2,30})/i);
 const last=take(/(?:นามสกุล|Last\s*name)\s*[:：]?\s*([^\n\t ]{2,30})/i);
 const ward=take(/\bWard\s*[:：]?\s*([^\n]{1,55})/i);
 return {hn,ln,first_name:first,last_name:last,date_of_birth:date,sex,ward};
}
export async function recognizeImage(file,onProgress=()=>{}){
 if(!window.CNMI_CONFIG?.ENABLE_OCR) throw Error('ฟังก์ชัน OCR ยังไม่เปิดใช้งาน รออนุมัติการใช้โมเดลในหน่วยงาน');
 if(!window.Tesseract){
  await new Promise((resolve,reject)=>{
   const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
   s.crossOrigin='anonymous';s.onload=resolve;s.onerror=()=>reject(Error('โหลด OCR ไม่สำเร็จ — กรุณากรอกข้อมูลเอง'));document.head.append(s);
  });
 }
 let worker;
 try{
  worker=await window.Tesseract.createWorker('tha+eng',1,{logger:e=>{if(e.status==='recognizing text')onProgress(Math.round((e.progress||0)*100))}});
  const result=await worker.recognize(file);return {text:result.data.text,fields:extractLISFields(result.data.text)};
 }finally{if(worker)await worker.terminate()}
}
