"""
test_property.py — Property-Based Tests using Hypothesis
Lab 9 — Step 3: Property-Based Testing

Property ที่ test:
  P1: Score อยู่ใน [0.0, 100.0] เสมอ
  P2: apply_discount(amount, 0) == amount (identity)
  P3: apply_discount(amount, 100) == 0 (annihilation)
  P4: apply_discount ไม่ทำให้ราคา < 0 (non-negative invariant)
  P5: ยิ่งส่วนลดมาก → ราคาที่ได้ยิ่งน้อยลงหรือเท่าเดิม (monotone)
  P6: ถ้า user มีทักษะครบ required → score = 100.0 เสมอ
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from hypothesis import HealthCheck, assume, given, settings
from hypothesis import strategies as st

from match_score import apply_discount, calculate_match_score

# ─────────────────────────────────────────────────────────────
# Strategies
# ─────────────────────────────────────────────────────────────

SKILL_NAMES = st.sampled_from([
    'Python', 'JavaScript', 'TypeScript', 'Docker', 'Git',
    'FastAPI', 'Next.js', 'PostgreSQL', 'Redis', 'Figma',
])

SKILL_LEVEL = st.integers(min_value=1, max_value=5)

skill_dict = st.dictionaries(
    keys=SKILL_NAMES,
    values=SKILL_LEVEL,
    min_size=0,
    max_size=6,
)

# Common settings that suppress internal health checks
_settings = settings(
    max_examples=100,
    suppress_health_check=[HealthCheck.too_slow, HealthCheck.filter_too_much],
)


# ─────────────────────────────────────────────────────────────
# P1: Match Score ต้องอยู่ในช่วง [0.0, 100.0] เสมอ (range invariant)
# ─────────────────────────────────────────────────────────────
@given(required=skill_dict, user=skill_dict)
@settings(
    max_examples=150,
    suppress_health_check=[HealthCheck.too_slow, HealthCheck.filter_too_much],
)
def test_match_score_always_in_valid_range(required, user):
    """Property P1 — Score ต้องอยู่ใน [0, 100] ไม่ว่าอินพุตจะเป็นอะไร"""
    result = calculate_match_score(required, user)
    assert 0.0 <= result <= 100.0, (
        f"Score {result} is out of [0, 100] for required={required}, user={user}"
    )


# ─────────────────────────────────────────────────────────────
# P2: apply_discount(amount, 0) == amount (Identity — ส่วนลด 0% ไม่เปลี่ยนราคา)
# ─────────────────────────────────────────────────────────────
@given(amount=st.integers(min_value=0, max_value=10_000))
@settings(max_examples=100, suppress_health_check=[HealthCheck.too_slow])
def test_apply_discount_zero_percent_is_identity(amount):
    """Property P2 — ส่วนลด 0% ต้องคืนค่าเดิม (identity property)"""
    result = apply_discount(amount, 0)
    assert abs(result - amount) < 1e-9, (
        f"Expected {amount}, got {result}"
    )


# ─────────────────────────────────────────────────────────────
# P3: apply_discount(amount, 100) == 0 (Annihilation — ส่วนลด 100% = ฟรี)
# ─────────────────────────────────────────────────────────────
@given(amount=st.integers(min_value=0, max_value=10_000))
@settings(max_examples=100, suppress_health_check=[HealthCheck.too_slow])
def test_apply_discount_100_percent_gives_zero(amount):
    """Property P3 — ส่วนลด 100% ต้องได้ราคา 0 (annihilation)"""
    result = apply_discount(amount, 100)
    assert abs(result) < 1e-9, (
        f"Expected 0, got {result} for amount={amount}"
    )


# ─────────────────────────────────────────────────────────────
# P4: apply_discount ต้องคืนค่า >= 0 เสมอ (non-negative invariant)
# ─────────────────────────────────────────────────────────────
@given(
    amount=st.integers(min_value=0, max_value=10_000),
    pct=st.integers(min_value=0, max_value=100),
)
@settings(max_examples=100, suppress_health_check=[HealthCheck.too_slow])
def test_apply_discount_result_is_non_negative(amount, pct):
    """Property P4 — ราคาหลังหักส่วนลดต้องไม่ติดลบ"""
    result = apply_discount(amount, pct)
    assert result >= -1e-9, (
        f"Got negative result {result} for amount={amount}, pct={pct}"
    )


# ─────────────────────────────────────────────────────────────
# P5: ส่วนลดมากขึ้น → ราคาน้อยลงหรือเท่ากัน (monotone decreasing)
# ─────────────────────────────────────────────────────────────
@given(
    amount=st.integers(min_value=0, max_value=10_000),
    pct_low=st.integers(min_value=0, max_value=50),
    pct_high=st.integers(min_value=50, max_value=100),
)
@settings(max_examples=100, suppress_health_check=[HealthCheck.too_slow, HealthCheck.filter_too_much])
def test_apply_discount_monotone_decreasing(amount, pct_low, pct_high):
    """Property P5 — ส่วนลดยิ่งมาก ราคายิ่งน้อย (monotone decreasing)"""
    assume(pct_low <= pct_high)
    result_low = apply_discount(amount, pct_low)
    result_high = apply_discount(amount, pct_high)
    assert result_low >= result_high - 1e-9, (
        f"Monotone violated: discount({amount}, {pct_low})={result_low} "
        f"< discount({amount}, {pct_high})={result_high}"
    )


# ─────────────────────────────────────────────────────────────
# P6 (Match Score): ผู้ใช้มีทักษะครบ required → score = 100.0
# ─────────────────────────────────────────────────────────────
@given(required=skill_dict.filter(lambda d: len(d) > 0))
@settings(
    max_examples=80,
    suppress_health_check=[HealthCheck.too_slow, HealthCheck.filter_too_much],
)
def test_match_score_superset_user_always_100(required):
    """Property P6 — ถ้า user_skills ≥ required_skills ทุก skill → score = 100.0"""
    # สร้าง user_skills ที่มีทักษะครบทุกอย่างและระดับสูงพอ
    user_skills = {skill: level + 1 for skill, level in required.items() if level < 5}
    user_skills.update({skill: level for skill, level in required.items() if level == 5})
    result = calculate_match_score(required, user_skills)
    assert result == 100.0, (
        f"Expected 100.0 but got {result} for required={required}"
    )
