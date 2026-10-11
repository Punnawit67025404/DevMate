"""
test_fizzbuzz.py — TDD Kata: FizzBuzz
Lab 9 — Step 2: Red-Green-Refactor

TDD Commit History:
  test: add FizzBuzz(3) test [RED]
  feat: minimal FizzBuzz for 3 [GREEN]
  test: add FizzBuzz(5) test [RED]
  feat: extend FizzBuzz for 5 [GREEN]
  test: add FizzBuzz(15) test [RED]
  feat: extend FizzBuzz for 15 [GREEN]
  test: add FizzBuzz(1) and FizzBuzz(7) test [RED]
  feat: extend FizzBuzz for plain numbers [GREEN]
  refactor: extract is_multiple helper
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import pytest

from fizzbuzz import fizzbuzz, is_multiple


# ──────────────────────────────────────────────────────────────────────────────
# RED → GREEN cycle 1: fizzbuzz(3) == "Fizz"
# ──────────────────────────────────────────────────────────────────────────────
def test_fizzbuzz_multiple_of_3_returns_fizz():
    """n หารด้วย 3 ลงตัว → 'Fizz'"""
    # Arrange
    n = 3
    # Act
    result = fizzbuzz(n)
    # Assert
    assert result == "Fizz"


def test_fizzbuzz_6_returns_fizz():
    """n=6 (multiple of 3, not 5) → 'Fizz'"""
    assert fizzbuzz(6) == "Fizz"


def test_fizzbuzz_9_returns_fizz():
    """n=9 (multiple of 3, not 5) → 'Fizz'"""
    assert fizzbuzz(9) == "Fizz"


# ──────────────────────────────────────────────────────────────────────────────
# RED → GREEN cycle 2: fizzbuzz(5) == "Buzz"
# ──────────────────────────────────────────────────────────────────────────────
def test_fizzbuzz_multiple_of_5_returns_buzz():
    """n หารด้วย 5 ลงตัว → 'Buzz'"""
    # Arrange
    n = 5
    # Act
    result = fizzbuzz(n)
    # Assert
    assert result == "Buzz"


def test_fizzbuzz_10_returns_buzz():
    """n=10 (multiple of 5, not 3) → 'Buzz'"""
    assert fizzbuzz(10) == "Buzz"


# ──────────────────────────────────────────────────────────────────────────────
# RED → GREEN cycle 3: fizzbuzz(15) == "FizzBuzz"
# ──────────────────────────────────────────────────────────────────────────────
def test_fizzbuzz_multiple_of_15_returns_fizzbuzz():
    """n หารด้วย 15 ลงตัว → 'FizzBuzz' (boundary: เป็น multiple ของทั้ง 3 และ 5)"""
    # Arrange
    n = 15
    # Act
    result = fizzbuzz(n)
    # Assert
    assert result == "FizzBuzz"


def test_fizzbuzz_30_returns_fizzbuzz():
    """n=30 (multiple of 15) → 'FizzBuzz'"""
    assert fizzbuzz(30) == "FizzBuzz"


# ──────────────────────────────────────────────────────────────────────────────
# RED → GREEN cycle 4: fizzbuzz(1) == "1", fizzbuzz(7) == "7"
# ──────────────────────────────────────────────────────────────────────────────
def test_fizzbuzz_1_returns_string_1():
    """n=1 (ไม่หารด้วย 3 หรือ 5) → '1'"""
    # Arrange / Act / Assert
    assert fizzbuzz(1) == "1"


def test_fizzbuzz_7_returns_string_7():
    """n=7 (ไม่หารด้วย 3 หรือ 5) → '7'"""
    assert fizzbuzz(7) == "7"


def test_fizzbuzz_2_returns_string_2():
    """n=2 → '2' (boundary just before 3)"""
    assert fizzbuzz(2) == "2"


# ──────────────────────────────────────────────────────────────────────────────
# Refactor validation: is_multiple helper
# ──────────────────────────────────────────────────────────────────────────────
def test_is_multiple_true():
    """is_multiple(15, 3) → True"""
    assert is_multiple(15, 3) is True


def test_is_multiple_false():
    """is_multiple(7, 3) → False"""
    assert is_multiple(7, 3) is False


def test_is_multiple_boundary_itself():
    """is_multiple(3, 3) → True (n เท่ากับ divisor เอง)"""
    assert is_multiple(3, 3) is True


# ──────────────────────────────────────────────────────────────────────────────
# Parametrize: ตรวจสอบหลายค่าพร้อมกัน
# ──────────────────────────────────────────────────────────────────────────────
@pytest.mark.parametrize("n, expected", [
    (1, "1"),
    (2, "2"),
    (3, "Fizz"),
    (4, "4"),
    (5, "Buzz"),
    (6, "Fizz"),
    (7, "7"),
    (10, "Buzz"),
    (15, "FizzBuzz"),
    (30, "FizzBuzz"),
    (45, "FizzBuzz"),
])
def test_fizzbuzz_parametrized(n, expected):
    """Parametrized: ครอบคลุมหลาย equivalence classes"""
    assert fizzbuzz(n) == expected
