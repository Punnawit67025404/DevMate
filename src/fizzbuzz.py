"""
fizzbuzz.py — TDD Kata: FizzBuzz
สร้างโดยวิธี Red-Green-Refactor

Commit history:
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


def is_multiple(n: int, divisor: int) -> bool:
    """ตรวจสอบว่า n หาร divisor ลงตัวหรือไม่"""
    return n % divisor == 0


def fizzbuzz(n: int) -> str:
    """
    คืนค่า:
    - "FizzBuzz" ถ้า n หารด้วย 3 และ 5 ได้
    - "Fizz" ถ้า n หารด้วย 3 ได้
    - "Buzz" ถ้า n หารด้วย 5 ได้
    - str(n) กรณีอื่น

    Parameters
    ----------
    n : int
        จำนวนเต็มบวก

    Examples
    --------
    >>> fizzbuzz(3)
    'Fizz'
    >>> fizzbuzz(5)
    'Buzz'
    >>> fizzbuzz(15)
    'FizzBuzz'
    >>> fizzbuzz(7)
    '7'
    """
    if is_multiple(n, 15):
        return "FizzBuzz"
    if is_multiple(n, 3):
        return "Fizz"
    if is_multiple(n, 5):
        return "Buzz"
    return str(n)
