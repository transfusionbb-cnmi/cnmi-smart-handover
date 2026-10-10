// ตั้งค่าหลังสร้าง Supabase Project; SUPABASE_ANON_KEY เป็น Publishable / anon key เท่านั้น
// ห้ามใส่ service_role / secret key ในไฟล์นี้ เพราะเว็บสาธารณะอ่านได้
window.CNMI_CONFIG = {
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",
  ALLOW_DEMO: true,               // ปิดเป็น false ก่อนใช้กับข้อมูลจริง
  ENABLE_SPEECH: false,            // เปิดได้เฉพาะเมื่อโรงพยาบาลอนุมัติการประมวลผลเสียง
  ENABLE_OCR: false,               // OCR โหลดโมเดลภายนอก: เปิดเมื่อ IT อนุมัติแหล่งโมเดล
  ORGANIZATION_NAME: "CNMI Blood Bank",
  CONTACT_URL: ""
};
