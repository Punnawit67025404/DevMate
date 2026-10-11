1. Code Smell
Duplicated Code
พบโค้ดตรวจสอบ name และ email ซ้ำกันในหลายฟังก์ชัน ทำให้เมื่อแก้ไขเงื่อนไขต้องแก้หลายจุด และเพิ่มโอกาสเกิดข้อผิดพลาด
🤖 2. Prompt ที่ใช้กับ AI
ช่วยวิเคราะห์โค้ดนี้ว่ามี Code Smell หรือไม่
โดยเฉพาะ Duplicated Code และเสนอวิธี Refactoring
โดยต้องคงพฤติกรรมเดิมของโปรแกรมไว้
พร้อมแสดงโค้ด Before และ After
❌ 3. Before
function validateProfile(name: string, email: string) {
  if (!name || name.trim() === "") return false;
  if (!email || !email.includes("@")) return false;
  return true;
}

function validateUser(name: string, email: string) {
  if (!name || name.trim() === "") return false;
  if (!email || !email.includes("@")) return false;
  return true;
}
ปัญหา: มี Logic สำหรับตรวจสอบ name และ email ซ้ำกันในหลายฟังก์ชัน
✅ 4. After
function isValidName(name: string) {
  return Boolean(name && name.trim() !== "");
}

function isValidEmail(email: string) {
  return Boolean(email && email.includes("@"));
}

function validateProfile(name: string, email: string) {
  return isValidName(name) && isValidEmail(email);
}

function validateUser(name: string, email: string) {
  return isValidName(name) && isValidEmail(email);
}
การเปลี่ยนแปลง:
แยก Logic ที่ซ้ำกันออกเป็นฟังก์ชัน
ลดการเขียนโค้ดซ้ำ
สามารถนำฟังก์ชันกลับมาใช้ซ้ำได้
แก้ไขเงื่อนไขได้จากจุดเดียว
📚 5. สิ่งที่เรียนรู้
การแยกโค้ดที่ซ้ำกันออกเป็นฟังก์ชันช่วย ลดความซ้ำซ้อน ทำให้แก้ไขและนำกลับมาใช้ซ้ำได้ง่ายขึ้น และลดโอกาสเกิดข้อผิดพลาดเมื่อระบบมีขนาดใหญ่ขึ้น
นอกจากนี้ AI สามารถช่วยเสนอแนวทาง Refactoring ได้ แต่ผู้พัฒนาต้องตรวจสอบและทดสอบโค้ดก่อนนำไปใช้จริง
