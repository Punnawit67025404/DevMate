# Saboteur Testing Journal — Lab 9
> **รายวิชา:** แนวคิดวิศวกรรมซอฟต์แวร์ (225311) · Lab 9  
> **ทีม:** 0pnSku1d · DevMatch Project  
> **วันที่:** 27 กันยายน 2569  

---

## คืออะไร Saboteur Testing?

Saboteur Testing คือการจงใจ **break production code** เพื่อตรวจสอบว่า test suite สามารถ "จับ" bug ได้จริง ถ้า test ผ่านแม้ code จะ broken แสดงว่า test ไม่ครอบคลุม behavior นั้น

---

## Saboteur 1: 破壊 `calculate_match_score` — Boundary Condition Bug

### 🐛 Bug ที่จงใจ Break

**ไฟล์:** `src/match_score.py`  
**บรรทัด:** เงื่อนไขเปรียบเทียบระดับทักษะ

**โค้ดปกติ (Green):**
```python
if user_level >= min_level:   # ≥ ถูกต้อง
    matched_count += 1
```

**โค้ดที่ Break (Red/Sabotage):**
```python
if user_level > min_level:    # > แทน ≥ → bug!
    matched_count += 1
```

### 🎯 เหตุผลที่เลือก Bug นี้

เปลี่ยน `>=` เป็น `>` เป็น **off-by-one error** ที่พบบ่อยมากใน business logic  
ผลกระทบ: ผู้ใช้ที่มีทักษะระดับเท่ากับที่โปรเจกต์กำหนดพอดี จะ**ไม่ถูกนับ** ทำให้ Match Score ต่ำกว่าที่ควรจะเป็น

### ✅ Tests ที่ "จับ" Bug ได้

| Test | สิ่งที่ทดสอบ | ผล Sabotage |
|---|---|---|
| `test_match_score_skill_level_exactly_at_boundary_counts` | EP7 — ระดับพอดี boundary | ❌ FAIL → จับได้ ✅ |
| `test_match_score_full_match_returns_100` | EP3 — ทุกทักษะตรง | ❌ FAIL → จับได้ ✅ |
| `test_match_score_parametrized` (P6 Hypothesis) | Property: superset → 100 | ❌ FAIL → จับได้ ✅ |

### 📋 ผล GitHub Actions

```
FAILED tests/test_unit.py::test_match_score_skill_level_exactly_at_boundary_counts
FAILED tests/test_unit.py::test_match_score_full_match_returns_100
FAILED tests/test_property.py::test_match_score_superset_user_always_100

3 failed, 21 passed in 2.14s
```

**Actions ผลลัพธ์:** 🔴 **FAIL** — CI block merge สำเร็จ ✅

### 🔁 Revert

หลังจากยืนยันว่า test จับได้ → revert กลับเป็น `>=`:
```bash
git revert HEAD  # หรือ manual fix
```

```
commit docs: saboteur test result — coverage 3/3 detected
```

---

## Saboteur 2: 破壊 `apply_discount` — Logic Inversion Bug

### 🐛 Bug ที่จงใจ Break

**ไฟล์:** `src/match_score.py`

**โค้ดปกติ:**
```python
discount = amount * (percentage / 100.0)
return round(amount - discount, 10)
```

**โค้ดที่ Break:**
```python
discount = amount * (percentage / 100.0)
return round(amount + discount, 10)  # + แทน - → เพิ่มราคาแทนลด!
```

### ✅ Tests ที่จับได้

| Test | ผล |
|---|---|
| `test_apply_discount_zero_percent_is_identity` | ✅ ผ่าน (0% ไม่กระทบ) |
| `test_apply_discount_100_percent_gives_zero` | ❌ FAIL (คืน 200 แทน 0) |
| `test_apply_discount_result_is_non_negative` | ✅ ผ่าน (บวกก็ยัง ≥ 0) |
| `test_apply_discount_monotone_decreasing` | ❌ FAIL (ยิ่งลด ยิ่งแพง) |

**Actions ผลลัพธ์:** 🔴 **FAIL** — จับได้ ✅

---

## สรุป Saboteur Testing

| Sabotage | Bug Type | Tests Caught | Detected? |
|---|---|---|---|
| `>` แทน `>=` (boundary) | Off-by-one | 3 tests | ✅ Yes |
| `+` แทน `-` (logic inversion) | Wrong operator | 2 tests | ✅ Yes |

### บทเรียน (Lessons Learned)

1. **Boundary Value Tests สำคัญมาก** — Saboteur 1 พิสูจน์ว่า EP7 boundary test จำเป็น  
2. **Property Tests ช่วยจับ pattern-level bugs** — `monotone_decreasing` จับ Saboteur 2 ได้  
3. **Test suite ที่ดีต้อง fail เมื่อ code salah** — ถ้า test ไม่ fail แสดงว่า test ไม่มีประโยชน์  
4. **State Coverage > Code Coverage** — `assert True` ไม่ใช่ test จริง (Tip 93)

---

*บันทึกโดย: ทีม 0pnSku1d — Lab 9 Saboteur Testing*
