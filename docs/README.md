# MOSSA Web App Planning

ชุดเอกสารนี้เป็น requirement ตั้งต้นสำหรับทำเว็บแอป MOSSA Sport Society เวอร์ชันแรก

## ไฟล์หลัก

- [mossa-web-app-requirements.md](./mossa-web-app-requirements.md) - ขอบเขต, เป้าหมาย, user flows, requirement และ acceptance criteria
- [sitemap.md](./sitemap.md) - แผนผังหน้าเว็บและโครง UX
- [data-structure.md](./data-structure.md) - โครงข้อมูลสำหรับบริการ ราคา เวลาเปิดปิด โปรโมชัน บริษัทคู่สัญญา และข้อมูลทดลองฟรี
- [mvp-roadmap.md](./mvp-roadmap.md) - แผนทำงานเป็นเฟส, สิ่งที่ต้องทำก่อน, สิ่งที่เลื่อนไป Phase 2

## หลักการเวอร์ชันแรก

- ทำเป็นเว็บใหม่ ไม่แก้เว็บเดิม
- Header ใช้ชื่อ `MOSSA Sport Society`
- SEO Title ใช้ `MOSSA Sport Society Rayong`
- ภาษาไทยก่อน แต่โครงข้อมูลรองรับภาษาอังกฤษในอนาคต
- Mobile-first
- LINE OA เป็น CTA หลัก
- ทำเป็นเว็บข้อมูล + เงื่อนไขทดลองฟรี 3 วันก่อน
- ยังไม่ทำระบบจองสนาม จองคลาส จอง PT หรือชำระเงินออนไลน์เต็มรูปแบบ
- Prototype ใช้ข้อมูลจากไฟล์ JSON ก่อน ยังไม่ทำ Admin เต็ม
- ตารางคลาสใช้ Data Table / Card Schedule เป็นหลัก
- Google Maps ยังไม่แสดงปุ่มนำทางจริงจนกว่าจะมีลิงก์ที่ยืนยันแล้ว
- ดีไซน์โทนสปอร์ตเข้ม มืออาชีพ ใช้ม่วง / ส้ม / ดำ / ขาว

## ข้อมูลที่ยังต้องคอนเฟิร์มก่อนขึ้น Production

- ลิงก์ Google Maps จริง
- รูปจริงชุดแรกของ MOSSA
- สิทธิ์ Membership ทุกแพ็กเกจว่ารวมเหมือนกันทั้งหมดหรือไม่
