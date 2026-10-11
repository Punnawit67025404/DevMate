# Sprint 1 Prototype: DevMate - SkillRequire

## 1. User Story ที่อ้างอิง
> **User Story (Must Priority):** 
> "ในฐานะหัวหน้าทีม/ผู้สร้างโปรเจกต์ ฉันต้องการกรองและค้นหาผู้ที่มีทักษะตรงตามข้อกำหนด (SkillRequire) คณะ และชั้นปีได้ เพื่อคัดเลือกสมาชิกที่มีทักษะตรงกับความต้องการของโปรเจกต์เข้าทีม"

---

## 2. การตัดสินใจเลือก: Prototype (Throwaway Prototype)

ทีมเลือกพัฒนาเป็น **Prototype (แบบทิ้งได้)** สำหรับ Sprint 1

**เหตุผลในการตัดสินใจ:**
* **เน้นเรียนรู้ UX/UI และ User Flow:** ต้องการทดสอบ Layout และการตอบสนองของระบบค้นหาตามทักษะ (SkillRequire) เพื่อดูว่าผู้ใช้เข้าใจการดู Match Score และการเลือก/ลบ Tag ทักษะหรือไม่
* **ยังไม่ลงโครงสร้างสถาปัตยกรรมจริง:** โค้ด HTML/CSS/JS ชุดนี้เขียนด้วย Plain Vanilla เพื่อความรวดเร็วในการทดลองแนวคิด (Proof of Concept) และตั้งใจจะทิ้งเพื่อเขียนใหม่ด้วย Production Framework และ REST API จริงใน Sprint 2

---

## 3. สิ่งที่ทำได้ (Completed Features)

1. **ระบบตัวกรองทักษะ (SkillRequire Filter & Tag Management):**
   * ปุ่ม "ล้างตัวกรอง" สามารถ Reset ค่า Checkbox และล้าง Tag ทักษะทั้งหมดได้จริง
   * ปุ่มกากบาท `×` บน Tag ทักษะกดลบ Tag ออกจากรายการค้นหาได้ทันที
2. **การโต้ตอบกับ Member Cards (Interactive Actions):**
   * ปุ่ม "เชิญเข้าทีม" มี Event Handler แสดงผลการแจ้งเตือน (Alert) เมื่อกด
   * ปุ่ม "Bookmark (🔖)" กด toggle สลับสถานะบันทึกโปรไฟล์พร้อมเปลี่ยนสีได้
3. **การแสดงผลความเข้ากันได้ (Match Score & Visualization):**
   * แสดงกราฟวงกลมจำลอง (CSS Conic Gradient) สำหรับ Match Score 92%
   * แสดงการเปรียบเทียบ "ทักษะที่ตรงกัน" และ "ทักษะที่แตกต่าง" ตามความต้องการของ SkillRequire

---

## 4. สิ่งที่ตั้งใจ "ไม่ได้ทำ" ใน Sprint นี้ (Out of Scope / Deliberately Omitted)

* **Backend & Real Database:** ข้อมูลสมาชิกและเปอร์เซ็นต์ Match Score เป็น Dummy Data ทั้งหมด ยังไม่มีฐานข้อมูลรองรับ
* **Dynamic Search & Filtering Logic:** การกดปุ่ม "ใช้ตัวกรอง" หรือเลือก Dropdown ยังไม่ได้กรองข้อมูลจริง
* **Authentication & Authorization:** ไม่มีระบบ Login/Logout หรือการระบุตัวตนของผู้ใช้
* **Data Persistence:** ไม่มีการเก็บบันทึกสถานะ (ปุ่ม Bookmark และการลบ Tag จะรีเซ็ตเมื่อ Refresh หน้าเว็บ)
* **Security & Input Validation:** ยังไม่มีการ Sanitize Input หรือความปลอดภัยของข้อมูล

---

## 5. แผนการต่อยอดใน Sprint 2 (Next Steps)

* นำข้อมูล Feedback ด้าน UX/UI ของฟังก์ชัน SkillRequire ไปปรับโครงสร้าง Component บน Framework ที่ทีมเลือกใช้
* พัฒนาโครงสร้างแบบ **Tracer Bullet** ใน Sprint 2 โดยเริ่มต่อเชื่อมระบบค้นหาแบบ End-to-End (Frontend $\rightarrow$ API Backend $\rightarrow$ Database)
* คำนวณเปอร์เซ็นต์ Match Score จริงตามอัลกอริทึมเปรียบเทียบทักษะ SkillRequire ในระบบ