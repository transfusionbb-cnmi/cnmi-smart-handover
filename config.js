// ตั้งค่าหลังสร้าง Supabase Project; SUPABASE_ANON_KEY เป็น Publishable / anon key เท่านั้น
// ห้ามใส่ service_role / secret key ในไฟล์นี้ เพราะเว็บสาธารณะอ่านได้
window.CNMI_CONFIG = {
  SUPABASE_URL: "https://exbcfzaqlszarddgfmft.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4YmNmemFxbHN6YXJkZGdmbWZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1OTc2NjAsImV4cCI6MjEwNzE3MzY2MH0.tyq3cV6peMN3dhtYlM3k-WVS1HwA-rCwel7oaHbFM6o",
  ALLOW_DEMO: false,               // ปิดเป็น true ก่อนใช้กับข้อมูลจริง
  ENABLE_SPEECH: false,            // เปิดได้เฉพาะเมื่อโรงพยาบาลอนุมัติการประมวลผลเสียง
  ENABLE_OCR: false,               // OCR โหลดโมเดลภายนอก: เปิดเมื่อ IT อนุมัติแหล่งโมเดล
  ORGANIZATION_NAME: "CNMI Blood Bank",
  CONTACT_URL: ""
};
