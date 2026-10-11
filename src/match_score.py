"""
match_score.py — DevMatch Core Business Logic
ระบบคำนวณคะแนนความเข้ากันได้ระหว่างโปรเจกต์กับผู้ใช้จากทักษะ
"""
from __future__ import annotations


def calculate_match_score(
    required_skills: dict[str, int],
    user_skills: dict[str, int],
) -> float:
    """
    คำนวณ Match Score (0–100) ระหว่างทักษะที่โปรเจกต์ต้องการกับทักษะของผู้ใช้

    Parameters
    ----------
    required_skills : dict[str, int]
        ทักษะที่โปรเจกต์ต้องการ {'skill_name': min_level}
        โดยระดับทักษะต้องอยู่ในช่วง 1-5

    user_skills : dict[str, int]
        ทักษะที่ผู้ใช้มี {'skill_name': level}
        โดยระดับทักษะต้องอยู่ในช่วง 1-5

    Returns
    -------
    float
        คะแนน 0.0–100.0

    Raises
    ------
    ValueError
        ถ้าระดับทักษะไม่อยู่ในช่วง 1-5
    """
    # Validate required skill levels
    for skill, level in required_skills.items():
        if not isinstance(level, int) or not 1 <= level <= 5:
            raise ValueError(
                f"required skill '{skill}' level must be between 1 and 5"
            )

    # Validate user skill levels
    for skill, level in user_skills.items():
        if not isinstance(level, int) or not 1 <= level <= 5:
            raise ValueError(
                f"user skill '{skill}' level must be between 1 and 5"
            )

    if not required_skills:
        return 0.0

    if not user_skills:
        return 0.0

    matched_count = 0
    total_weight = len(required_skills)

    for skill, min_level in required_skills.items():
        user_level = user_skills.get(skill, 0)

        if user_level >= min_level:
            matched_count += 1

    score = (matched_count / total_weight) * 100.0

    return round(score, 2)


def apply_discount(amount: float, percentage: float) -> float:
    """
    คำนวณราคาหลังหักส่วนลด

    Parameters
    ----------
    amount : float
        ราคาเดิม (ต้อง >= 0)
    percentage : float
        เปอร์เซ็นต์ส่วนลด (0–100)

    Returns
    -------
    float
        ราคาหลังหักส่วนลด

    Raises
    ------
    ValueError
        ถ้า amount < 0 หรือ percentage ไม่อยู่ใน [0, 100]

    Examples
    --------
    >>> apply_discount(100, 10)
    90.0
    >>> apply_discount(100, 0)
    100.0
    >>> apply_discount(100, 100)
    0.0
    """
    if amount < 0:
        raise ValueError(f"amount must be >= 0, got {amount}")
    if not (0 <= percentage <= 100):
        raise ValueError(f"percentage must be between 0 and 100, got {percentage}")

    discount = amount * (percentage / 100.0)
    return round(amount - discount, 10)
