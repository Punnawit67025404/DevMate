## 1. Pragmatic Approach

ได้เรียนรู้ว่าการทำ Software Engineering ต้องมีความรับผิดชอบต่อสิ่งที่ทำ ไม่ควรรอให้เกิดปัญหาแล้วค่อยแก้ แต่ควรหาสาเหตุและเตรียมทางเลือกไว้ล่วงหน้า

**สิ่งที่นำไปใช้:**  
เมื่อเจอปัญหาในการทำงาน จะพยายามวิเคราะห์สาเหตุและเสนอแนวทางแก้ไขก่อนขอความช่วยเหลือ

---

## 2. Agile

ได้เข้าใจว่า **Agile ไม่ได้หมายถึงการทำงานให้เร็วเพียงอย่างเดียว** แต่เป็นการทำงานที่สามารถปรับเปลี่ยนตาม Feedback และความต้องการที่เปลี่ยนไปได้

**สิ่งที่นำไปใช้:**  
จะแบ่งงานเป็นส่วนเล็ก ๆ และตรวจสอบความคืบหน้าอย่างสม่ำเสมอ แทนการทำทุกอย่างพร้อมกันตอนท้าย

---

## 3. Requirements Engineering

ได้เรียนรู้ว่าการเก็บ Requirements ไม่ใช่เพียงการถามว่าผู้ใช้ต้องการอะไร แต่ต้องเข้าใจปัญหา ผู้ใช้ และบริบทของการใช้งาน รวมถึงแยก **Functional Requirements** และ **Non-Functional Requirements**

**สิ่งที่นำไปใช้:**  
จะพยายามเขียน Requirement ให้ชัดเจนและสามารถวัดผลได้ โดยเฉพาะ NFR ที่ไม่ควรใช้คำกว้าง ๆ เช่น "เร็ว" หรือ "ใช้ง่าย"

---

## 4. Prototyping with AI

ได้เรียนรู้ว่า Prototype ช่วยให้ทีมเห็นแนวคิดของระบบก่อนพัฒนาจริง และ AI สามารถช่วยสร้างหรือปรับปรุง Prototype ได้รวดเร็วขึ้น

**สิ่งที่นำไปใช้:**  
จะใช้ AI เป็นผู้ช่วยในการสร้างแนวคิดและ Prototype แต่จะตรวจสอบความถูกต้องและความเหมาะสมด้วยตัวเองก่อนนำไปใช้

---

## 5. Software Architecture

ได้เข้าใจว่า **Architecture และ Design มีผลต่อการเปลี่ยนแปลงของระบบในระยะยาว** การเลือก Architecture จึงต้องพิจารณา Trade-off เช่น ความสามารถในการขยายระบบ การดูแลรักษา และความเข้ากันได้

**สิ่งที่นำไปใช้:**  
ก่อนเลือกเทคโนโลยีหรือรูปแบบ Architecture จะพิจารณาข้อดี ข้อเสีย และผลกระทบต่อระบบก่อนตัดสินใจ

---

## 6. Cloud & Microservices

ได้เรียนรู้เกี่ยวกับ Cloud Service Models, Container, Microservices และ REST รวมถึงเข้าใจว่า Microservices ไม่ได้เหมาะกับทุกระบบ เพราะมีความซับซ้อนในการจัดการมากกว่า

**สิ่งที่นำไปใช้:**  
จะเลือกใช้ Architecture ให้เหมาะกับขนาดและความต้องการของระบบ ไม่เลือกเทคโนโลยีเพียงเพราะเป็นเทคโนโลยีที่ได้รับความนิยม

---

## 7. Clean Code

ได้เรียนรู้ว่าโค้ดที่ทำงานได้ไม่ได้หมายความว่าเป็นโค้ดที่ดี การตั้งชื่อที่สื่อความหมาย การลดโค้ดซ้ำ และการ Refactoring ช่วยให้โค้ดอ่านง่ายและดูแลต่อได้ง่ายขึ้น

**สิ่งที่นำไปใช้:**  
จะตรวจสอบโค้ดของตัวเองก่อน Commit และพยายามแก้ Code Smell ที่พบตั้งแต่เนิ่น ๆ เพื่อไม่ให้ปัญหาสะสมจนแก้ไขได้ยาก

---

## 8. Software Testing (Post-quiz 9)

### B1 — Unit Test Plan

**Function ที่เลือก:** `calculate_match_score(required_skills, user_skills)` ใน `src/match_score.py`  
เหตุผล: เป็น core business logic ของ DevMatch — ตัดสินว่าใครได้ Match กับโปรเจกต์ใด

**Equivalence Partitions (≥ 5):**

| # | Partition | Input | Expected Output |
|---|---|---|---|
| EP1 | required_skills ว่าง | `{}, {'Python': 3}` | `0.0` |
| EP2 | user_skills ว่าง | `{'Python': 3}, {}` | `0.0` |
| EP3 | Match ครบ 100% | required ⊆ user, ระดับสูงพอ | `100.0` |
| EP4 | ไม่มี skill ตรงกันเลย | skill ต่างชุดกัน | `0.0` |
| EP5 | Match บางส่วน (50%) | 1 ใน 2 skill ตรง | `50.0` |
| EP6 | ระดับต่ำกว่ากำหนด | user level < required level | `0.0` (ไม่นับ) |
| EP7 (Boundary) | ระดับเท่ากับที่กำหนดพอดี | user level == required level | นับ → `100.0` |
| EP8 | ระดับสูงกว่ากำหนด | user level > required level | นับ → `100.0` |

### B2 — TDD Plan (FizzBuzz)

Red-Green-Refactor Cycle:
1. **RED**: `test fizzbuzz(3) == "Fizz"` → fail
2. **GREEN**: `return "Fizz" if n % 3 == 0 else str(n)` → pass
3. **RED**: `test fizzbuzz(5) == "Buzz"` → fail  
4. **GREEN**: เพิ่ม condition สำหรับ 5 → pass
5. **RED**: `test fizzbuzz(15) == "FizzBuzz"` → fail
6. **GREEN**: ตรวจ 15 ก่อน 3 และ 5 → pass
7. **REFACTOR**: extract `is_multiple(n, d)` helper

### B3 — Property-Based Test Plan

**Function:** `apply_discount(amount, percentage)`  
**Properties:**
- P2: Identity — `apply_discount(x, 0) == x` (ส่วนลด 0% ไม่เปลี่ยนราคา)
- P3: Annihilation — `apply_discount(x, 100) == 0` (ส่วนลด 100% = ฟรี)
- P4: Non-negative — `apply_discount(x, p) >= 0` เสมอ
- P5: Monotone — `p1 <= p2 → apply_discount(x, p1) >= apply_discount(x, p2)`

**สิ่งที่ได้เรียนรู้จาก Lab 9:**

- **Test เป็น First User ของ Code** (Tip 67) — การเขียน test ก่อนทำให้เห็นว่า API ดีใช้งานได้หรือไม่
- **TDD ช่วย design ได้จริง** — ตอน Red phase บังคับให้คิดถึง interface ก่อน implementation
- **Property-Based Test เผย edge cases ที่ไม่คาดคิด** — Hypothesis ลอง input หลากหลายกว่าที่เราคิดถึง
- **Saboteur Testing พิสูจน์ว่า test ทำงานจริง** — ถ้า test ไม่ fail เมื่อ code broken แสดงว่า test ไร้ประโยชน์
- **State Coverage > Code Coverage** (Tip 93) — 80% coverage line ≠ test behavior ครบถ้วน
