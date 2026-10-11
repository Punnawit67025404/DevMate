# Safety Net ของทีม DevMatch

## 1. ฟังก์ชันที่เลือกทดสอบ

- ฟังก์ชัน: `calculate_match_score`
- ไฟล์: `src/match_score.py`
- เหตุผลที่เลือก: เป็น business logic หลักของระบบ DevMatch
  ใช้คำนวณคะแนนความเข้ากันได้ระหว่างทักษะที่โครงการต้องการ
  กับทักษะของผู้ใช้

## 2. Test ที่เขียน

| # | Test | ประเภท | ตรวจสอบ |
|---|---|---|---|
| 1 | `test_match_score_full_match_returns_100` | Happy | ทักษะตรงทั้งหมด = 100% |
| 2 | `test_match_score_partial_match_returns_50` | Happy | ตรงครึ่งหนึ่ง = 50% |
| 3 | `test_match_score_empty_required_returns_zero` | Edge | ไม่มี required skills = 0% |
| 4 | `test_match_score_empty_user_skills_returns_zero` | Edge | ไม่มี user skills = 0% |
| 5 | `test_match_score_no_matching_skills_returns_zero` | Edge | ไม่มี skill ที่ตรงกัน = 0% |
| 6 | `test_match_score_skill_level_exact_boundary_counts` | Boundary | ระดับเท่าขั้นต่ำถือว่าผ่าน |
| 7 | `test_match_score_skill_level_below_required_not_counted` | Boundary | ระดับต่ำกว่าขั้นต่ำไม่ผ่าน |
| 8 | `test_match_score_three_of_four_skills_returns_75` | Boundary | ตรง 3/4 = 75% |
| 9 | `test_match_score_invalid_required_skill_level_raises_error` | Error | required level นอกช่วง 1-5 |
| 10 | `test_match_score_invalid_user_skill_level_raises_error` | Error | user level นอกช่วง 1-5 |

## 3. Coverage

Name                     Stmts   Miss  Cover   Missing
------------------------------------------------------
src\fizzbuzz.py             10     10     0%   18-53
src\match_score.py          27      6    78%   99-105
src\tests\test_unit.py      55      0   100%
------------------------------------------------------
TOTAL                       92     16    83%

รันคำสั่ง:

```text
python -m pytest src/tests/test_unit.py -v --cov=src --cov-report=term-missing