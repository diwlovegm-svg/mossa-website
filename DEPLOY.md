# MOSSA Coupon Online Deploy

เอกสารนี้คือ checklist ก่อนเอาเว็บขึ้นออนไลน์สำหรับใช้งานที่เคาน์เตอร์ MOSSA

## สถานะปัจจุบัน

- เว็บ local พร้อมใช้งานที่ `http://127.0.0.1:4175/srirayong/`
- หน้าเคาน์เตอร์: `/srirayong/admin/`
- หน้าแก้คูปองเจ้าของ: `/srirayong/config/`
- ฐานข้อมูลจริงอยู่ใน Google Sheets ผ่าน Apps Script
- รหัสแก้ไขคูปองไม่ได้ฝังอยู่ในไฟล์ frontend แล้ว ต้องตั้งใน Apps Script Script Properties เท่านั้น

## ต้องทำก่อนออนไลน์

1. เปิด Apps Script project ของระบบคูปอง
2. วางโค้ดล่าสุดจาก `apps-script/Code.gs`
3. กด Save
4. ตรวจ Script Properties:
   - `SPREADSHEET_ID`
   - `COUPON_EDITOR_PASSCODE`
5. Deploy เป็น Web App version ใหม่
6. ทดสอบ Web App URL:
   - `check` ต้องตอบสถานะคูปองได้
   - `validateEditorPasscode` ควรรองรับหลัง deploy เวอร์ชันใหม่
7. อัปโหลดไฟล์เว็บขึ้น GitHub Pages repository ที่ serve `https://mossa-coupon.github.io/srirayong/`
8. เปิดหน้าเคาน์เตอร์บนคอมพนักงาน:
   - `https://mossa-coupon.github.io/srirayong/admin/`
9. เปิดหน้าแก้คูปองเฉพาะเจ้าของ:
   - `https://mossa-coupon.github.io/srirayong/config/`

## Smoke Test หลังออนไลน์

1. เปิด `/srirayong/claim/` แล้วกรอกชื่อและเบอร์ทดสอบ
2. ตรวจว่าระบบออกคูปองและแสดง barcode
3. เปิด `/srirayong/admin/`
4. ยิงหรือพิมพ์รหัสคูปอง
5. ตรวจว่าขึ้นสถานะจาก Google Sheets
6. ถ้าใช้ได้ ให้กด `ยืนยันใช้สิทธิ์`
7. กลับไปเช็ก Google Sheets ว่าสถานะเปลี่ยนเป็น `REDEEMED`
8. เปิด `/srirayong/config/`
9. ใส่รหัสแก้ไขคูปอง แล้วลองแก้ข้อความเล็กน้อยและบันทึก
10. กลับไปหน้า claim แล้วออกคูปองใหม่เพื่อตรวจว่า template ใหม่ถูกใช้ทันที

## ถ้า Chrome ที่เคาน์เตอร์กดตรวจแล้วไม่ขึ้นผล

ให้เช็กตามลำดับ:

1. เปิดอินเทอร์เน็ตได้ไหม
2. Chrome หรือ extension บล็อก `script.google.com` หรือไม่
3. Apps Script Web App deploy เป็น `Anyone` แล้วหรือยัง
4. Apps Script ยังเป็น URL เดิมที่อยู่ใน `srirayong/shared/campaignConfig.js` หรือไม่
5. Google Sheet มี tab `Coupons` และ header ครบหรือไม่

## หมายเหตุสำคัญ

- รูปคูปองที่ลูกค้าบันทึกไว้เป็นแค่หลักฐานหน้าเว็บ
- สถานะจริงต้องยึดจาก Google Sheets เท่านั้น
- พนักงานใช้หน้า `/admin/` เท่านั้น
- หน้า `/config/` สำหรับเจ้าของหรือคนที่รู้รหัสแก้ไขคูปองเท่านั้น
