# Data Structure

เอกสารนี้ออกแบบให้ใช้ได้ทั้งกับ Google Sheet + Apps Script ในเวอร์ชันแรก หรือย้ายไปฐานข้อมูลจริงในอนาคต

## 1. แนวทางรวม

- ใช้ `id` เป็น key หลักทุกตาราง
- มี `status` เพื่อเปิด/ปิดข้อมูลบนหน้าเว็บ
- มี `sort_order` เพื่อจัดลำดับการแสดงผล
- รองรับภาษาอังกฤษด้วย field `_en` แม้ยังไม่ใช้ในหน้าเว็บเวอร์ชันแรก
- ข้อมูลราคาควรแยกจากข้อมูลบริการ เพื่อแก้ง่าย

## 2. services

ข้อมูลบริการหลัก

| field | type | required | note |
|---|---|---:|---|
| id | string | yes | เช่น `fitness`, `pool`, `pt` |
| category_id | string | yes | อ้างอิง `service_categories.id` |
| name_th | string | yes | ชื่อบริการภาษาไทย |
| name_en | string | no | ชื่อภาษาอังกฤษ |
| short_description_th | text | yes | คำอธิบายสั้น |
| description_th | text | no | รายละเอียดเต็ม |
| image_url | string | no | รูปหลัก |
| gallery_urls | text/json | no | รูปเพิ่มเติม |
| primary_cta_type | enum | yes | `line`, `phone`, `trial_info`, `booking_phone` |
| primary_cta_label | string | yes | เช่น `แอด LINE`, `โทรจองสนาม` |
| primary_cta_value | string | yes | link หรือเบอร์ |
| status | enum | yes | `active`, `draft`, `hidden` |
| sort_order | number | yes | ลำดับแสดงผล |

## 3. service_categories

| id | name_th | name_en | sort_order |
|---|---|---|---:|
| fitness_membership | Fitness & Membership | Fitness & Membership | 1 |
| pool_wellness | Pool & Wellness | Pool & Wellness | 2 |
| group_class | คลาสออกกำลังกาย | Group Class | 3 |
| court_field | สนามกีฬา | Court & Field | 4 |
| training | เทรนนิ่ง | Training | 5 |
| kids_lessons | คอร์สเด็กและการเรียน | Kids & Lessons | 6 |
| corporate_contact | บริษัทคู่สัญญาและติดต่อ | Corporate & Contact | 7 |

## 4. prices

ข้อมูลราคา ควรให้แอดมินแก้ได้โดยไม่แก้หน้าเว็บ

| field | type | required | note |
|---|---|---:|---|
| id | string | yes | unique |
| service_id | string | yes | อ้างอิง `services.id` |
| package_name_th | string | yes | ชื่อแพ็กเกจ |
| package_name_en | string | no | ชื่ออังกฤษ |
| price | number | no | ราคาหลัก |
| price_text | string | yes | ใช้แสดง เช่น `150 บาท/ครั้ง` |
| price_for_two | number | no | กรณีแพ็กเกจ 2 ท่าน |
| unit_th | string | no | ครั้ง, เดือน, ชั่วโมง |
| duration_text | string | no | เช่น `10 ชม.` |
| before_17_price | number | no | สนาม |
| after_17_price | number | no | สนาม |
| display_note_th | text | no | เงื่อนไขแสดงหน้าเว็บ |
| is_featured | boolean | no | โปรโมตแพ็กเกจ |
| status | enum | yes | `active`, `draft`, `hidden` |
| sort_order | number | yes | ลำดับแสดงผล |

## 5. opening_hours

| field | type | required | note |
|---|---|---:|---|
| id | string | yes | unique |
| service_id | string | yes | อ้างอิง `services.id` |
| day_group_th | string | yes | เช่น `จันทร์-ศุกร์` |
| day_group_en | string | no | เช่น `Mon-Fri` |
| open_time | string | no | เช่น `06:30` |
| close_time | string | no | เช่น `22:00` |
| time_text_th | string | yes | ใช้แสดงจริง |
| note_th | text | no | เช่น `ตามตารางคลาสรายเดือน` |
| status | enum | yes | `active`, `hidden` |
| sort_order | number | yes | ลำดับ |

## 6. class_schedule

| field | type | required | note |
|---|---|---:|---|
| id | string | yes | unique |
| month | string | yes | เช่น `2026-07` |
| class_name | string | yes | ชื่อคลาส |
| day_of_week_th | string | yes | วัน |
| start_time | string | yes | เวลาเริ่ม |
| end_time | string | no | เวลาจบ |
| instructor_name | string | no | ครู |
| location | string | no | ห้อง |
| note_th | text | no | หมายเหตุ |
| status | enum | yes | `active`, `cancelled`, `hidden` |

## 7. class_schedule_assets

ใช้รองรับรูปตารางคลาสรายเดือน

| field | type | required | note |
|---|---|---:|---|
| id | string | yes | unique |
| month | string | yes | เช่น `2026-07` |
| image_url | string | yes | รูปตาราง |
| title_th | string | yes | ชื่อที่แสดง |
| status | enum | yes | `active`, `hidden` |

## 8. promotions

| field | type | required | note |
|---|---|---:|---|
| id | string | yes | unique |
| title_th | string | yes | ชื่อโปร |
| description_th | text | yes | รายละเอียด |
| image_url | string | no | รูปโปร |
| starts_at | date | no | วันเริ่ม |
| ends_at | date | no | วันหมดอายุ |
| cta_type | enum | yes | `line`, `phone`, `facebook`, `external_link` |
| cta_value | string | yes | link หรือเบอร์ |
| status | enum | yes | `active`, `draft`, `expired`, `hidden` |
| sort_order | number | yes | ลำดับ |

## 9. trial_info

ข้อมูลทดลองฟรี 3 วันสำหรับแสดงบนหน้าเว็บ

| field | type | required | note |
|---|---|---:|---|
| id | string | yes | unique |
| title_th | string | yes | เช่น `ทดลองฟรี 3 วัน` |
| eligibility_th | text | yes | เช่น `สำหรับผู้ที่ยังไม่เคยลองใช้บริการ MOSSA เท่านั้น` |
| required_document_th | text | yes | เช่น `นำบัตรประชาชนมายื่นที่เคาน์เตอร์` |
| included_services_th | text | yes | สิทธิ์ที่ใช้ได้ |
| usage_note_th | text | yes | ต้องใช้ต่อเนื่อง 3 วัน และเงื่อนไขอื่น |
| cta_type | enum | yes | `line`, `phone` |
| cta_value | string | yes | link หรือเบอร์ |
| status | enum | yes | `active`, `hidden` |

## 10. corporates

บริษัทคู่สัญญา

| field | type | required | note |
|---|---|---:|---|
| id | string | yes | unique |
| company_name_th | string | yes | ชื่อบริษัท |
| company_name_en | string | no | ชื่ออังกฤษ |
| search_keywords | text | no | ชื่อย่อ/คำค้น |
| fitness_access | enum | yes | `yes`, `no`, `ask` |
| pool_access | enum | yes | `yes`, `no`, `ask` |
| family_access | enum | yes | `yes`, `no`, `ask` |
| required_documents_th | text | no | เอกสารที่ต้องใช้ |
| public_condition_th | text | no | เงื่อนไขที่แสดงลูกค้า |
| internal_note | text | no | ห้ามแสดงบนเว็บ Public |
| status | enum | yes | `active`, `hidden`, `expired` |

## 11. contact_channels

| field | value |
|---|---|
| line_oa | `@Mossa2018` |
| line_url | `https://lin.ee/bEYfBW4` |
| facebook_name | `MOSSA Sport Society` |
| facebook_inbox_url | `https://m.me/1496135110620901` |
| main_phone_1 | `033-012-181` |
| main_phone_2 | `094-696-6179` |
| field_booking_phone | `094-406-1555` |
| instagram | `mossasportsociety.rayong` |
| tiktok | `@mossasportsociety` |
| google_maps_url | `TODO` |

## 12. Seed Price Content

### Membership / Fitness

| package | price_1_person | price_2_person | note |
|---|---:|---:|---|
| รายวัน | 500 |  | เหมือน Membership 1 วัน รวมผ้า |
| คูปอง 10 ครั้ง | 3500 |  | 10 ครั้ง |
| 1 เดือน | 5000 | 8500 |  |
| 3 เดือน | 9900 | 16830 |  |
| 6 เดือน | 17500 | 29750 |  |
| 12 เดือน | 22500 | 38250 | แบบคู่ในไฟล์ระบุว่า Drop ได้ 3 เดือน |

### Swimming Pool

| type | condition | price | note |
|---|---|---:|---|
| เด็ก | สูงไม่เกิน 150 ซม. | 100 |  |
| ผู้ใหญ่ | สูงเกิน 150 ซม. | 150 | รวมซาวน่า/สตีม |

### Badminton Court

| time | price |
|---|---:|
| ก่อน 17:00 น. | 120 บาท/ชั่วโมง |
| หลัง 17:00 น. | 150 บาท/ชั่วโมง |

หมายเหตุ: จองสนามโทร `094-406-1555`

### Football Field

| field | before_17 | after_17 |
|---|---:|---:|
| Indoor สนาม 1 Shock Pad | 1000 บาท/ชม. | 1500 บาท/ชม. |
| Indoor สนาม 2 | 800 บาท/ชม. | 1200 บาท/ชม. |
| Outdoor สนามใหญ่ | 1000 บาท/ชม. | 1400 บาท/ชม. |

เงื่อนไข:

- รับน้ำฟรี 12 ขวดต่อ 1 ชั่วโมง
- รับเสื้อกั๊กไม่เกิน 9 ตัวต่อชั่วโมง
- ใช้บริการสนามฟุตบอลและห้องน้ำสนามฟุตบอลเท่านั้น
- จองสนามก่อนเข้าใช้บริการ โทร `094-406-1555`

### PT / Boxing PT

| hours | solo_package | solo_avg | duo_package | duo_avg |
|---:|---:|---:|---:|---:|
| 1 | 950 | 950 | 1500 | 750 |
| 10 | 7500 | 750 | 13000 | 6500 |
| 25 | 17500 | 700 | 30000 | 15000 |
| 50 | 33750 | 675 | 55000 | 27500 |
| 80 | 52000 | 650 | 80000 | 40000 |

หมายเหตุ: First PT สำหรับสมาชิกใหม่ 3 ชั่วโมง 1,200 บาท ใช้ได้ครั้งเดียว

### Sport Massage

| hours | price | avg_per_hour |
|---:|---:|---:|
| 1 | 950 | 950 |
| 5 | 4250 | 800 |
| 10 | 7500 | 750 |
| 25 | 17500 | 700 |
| 50 | 33750 | 675 |
| 80 | 52000 | 650 |

หมายเหตุ: ใช้บริการได้เฉพาะภายในห้องนวด

### Aquatic PT

| format | price_10_hours | average |
|---|---:|---|
| 1 คน | 7500 | 750 บาท/ชม. |
| 2 คน | 11250 | 5625 บาท/คน |
| 3-4 คน | 13125 | 3280-4375 บาท/คน |

หมายเหตุ: รวมผ้าขนหนู และใช้บริการได้เฉพาะสระว่ายน้ำ ซาวน่า/สตีม และล็อกเกอร์

### Kids Training

| course | detail | price |
|---|---|---:|
| Sport Training For Kid | 10 ชม. / 1 คน | 8000 |
| Sport Training For Kid | 10 ชม. / 2 คน | 13000 |
| Sport Training Group For Kid | 4 ชม. | 3000 |
| Sport Training Group For Kid | 8 ชม. | 5000 |
| Drum & Dance For Kids | 4 ชม. | 3000 |
| Drum & Dance For Kids | 8 ชม. | 5000 |

เงื่อนไข: คอร์สกลุ่ม Sport Training Group และ Drum & Dance จำกัดอายุ 7-14 ปี

### Private Swimming Course

| format | duration | price |
|---|---|---:|
| เรียนเดี่ยว | 10 ชม. | 3500 |
| เรียนคู่ 2 ท่าน | 10 ชม. | 5500 |

หมายเหตุ: ยังไม่รวมค่าลงสระ มีค่าลงสระเพิ่มเติมครั้งละ 50 บาท รับอายุ 4 ปีขึ้นไป

### Group Swimming Course

| item | detail |
|---|---|
| ราคา | 2,500 บาท/คน |
| อายุ | 8 ขวบขึ้นไป |
| รูปแบบ | L1 พื้นฐาน / L2 มีพื้นฐาน |
| จำนวนขั้นต่ำ | เปิดสอนเมื่อมีผู้เรียนตั้งแต่ 5 คนขึ้นไป |
| ระยะเวลา | คอร์สละ 10 วัน |
| สิทธิ์ที่รวม | ค่าลงสระ ผ้าเช็ดตัว และอุปกรณ์ประกอบการสอน |

### Badminton Lesson

| item | detail |
|---|---|
| อายุ | ตั้งแต่ 5 ปีขึ้นไป |
| กลุ่มผู้เรียน | เด็กจนถึงบุคคลทั่วไป |
| ผู้ติดต่อ | โค้ชแจ็ค ศรายุทธ แซ่ตั้ง |
| เบอร์ | 099-0975-111 |
| ราคา | TODO: ยังไม่มีราคา ให้แสดง `สอบถามรายละเอียด` |

### Taekwondo

| item | detail |
|---|---|
| ราคา | เริ่มต้น 1,200 บาท |
| วันเรียน | เสาร์-อาทิตย์ 09:00-11:00 น. |
| วันเรียนเพิ่มเติม | พุธ และ ศุกร์ 17:00-19:00 น. |
| ผู้ติดต่อ | ครูปอนด์ |
| เบอร์ | 099-3594593, 092-5416924 |
| Facebook | KP สมาร์ทเทควันโด |

## 13. Seed Opening Hours

| service | day | time |
|---|---|---|
| ฟิตเนส | จันทร์-ศุกร์ | 06:30-22:00 น. |
| ฟิตเนส | เสาร์-อาทิตย์ และวันหยุดนักขัตฤกษ์ | 08:00-21:00 น. |
| สระว่ายน้ำ | จันทร์-ศุกร์ | 08:00-21:30 น. |
| สระว่ายน้ำ | เสาร์-อาทิตย์ และวันหยุดนักขัตฤกษ์ | 08:00-20:30 น. |
| สนามแบดมินตัน | ทุกวัน | 08:00-22:00 น. |
| สนามฟุตบอล | ทุกวัน | 08:00-22:00 น. |
| คลาสออกกำลังกาย | ตามตารางคลาสรายเดือน | ไม่ใช่เวลาเปิดปิดตายตัว |
| PT | ตามนัดหมาย / ตามเวลาบริการของคลับ | สอบถาม |
| Sport Massage | ตามนัดหมาย | สอบถาม |
| คอร์สว่ายน้ำ | ตามรอบเรียน / นัดหมายครู | สอบถาม |
| เทควันโด | ตามตารางเรียน | พุธ/ศุกร์/เสาร์/อาทิตย์ |
