"""
test_unit.py — Unit Tests for calculate_match_score (DevMatch)

Lab 12B — Safety Net
Coverage:
- Happy Path
- Edge Case
- Boundary Case
- Error Case
"""

import os
import sys

import pytest

# Allow importing from src/
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from match_score import calculate_match_score

# ============================================================
# HAPPY PATH
# ============================================================

def test_match_score_full_match_returns_100():
    """ผู้ใช้มีทักษะครบและระดับสูงพอ → 100%"""
    required_skills = {
        "Python": 3,
        "Git": 2,
        "Docker": 1,
    }

    user_skills = {
        "Python": 4,
        "Git": 3,
        "Docker": 2,
    }

    result = calculate_match_score(required_skills, user_skills)

    assert result == 100.0


def test_match_score_partial_match_returns_50():
    """ผู้ใช้ตรงกับ 1 ใน 2 ทักษะ → 50%"""
    required_skills = {
        "Python": 3,
        "Docker": 2,
    }

    user_skills = {
        "Python": 4,
    }

    result = calculate_match_score(required_skills, user_skills)

    assert result == 50.0


# ============================================================
# EDGE CASE
# ============================================================

def test_match_score_empty_required_returns_zero():
    """ไม่มี required skills → 0%"""
    required_skills = {}

    user_skills = {
        "Python": 3,
        "Git": 2,
    }

    result = calculate_match_score(required_skills, user_skills)

    assert result == 0.0


def test_match_score_empty_user_skills_returns_zero():
    """ผู้ใช้ไม่มี skills → 0%"""
    required_skills = {
        "Python": 3,
        "Docker": 2,
    }

    user_skills = {}

    result = calculate_match_score(required_skills, user_skills)

    assert result == 0.0


def test_match_score_no_matching_skills_returns_zero():
    """ผู้ใช้ไม่มี skill ที่ตรงกับ project → 0%"""
    required_skills = {
        "Python": 3,
        "Docker": 2,
    }

    user_skills = {
        "Java": 5,
        "Kubernetes": 4,
    }

    result = calculate_match_score(required_skills, user_skills)

    assert result == 0.0


# ============================================================
# BOUNDARY CASE
# ============================================================

def test_match_score_skill_level_exact_boundary_counts():
    """ระดับทักษะเท่ากับขั้นต่ำพอดี → ถือว่าผ่าน"""
    required_skills = {
        "Python": 3,
    }

    user_skills = {
        "Python": 3,
    }

    result = calculate_match_score(required_skills, user_skills)

    assert result == 100.0


def test_match_score_skill_level_below_required_not_counted():
    """ระดับทักษะต่ำกว่าที่กำหนด → ไม่นับ"""
    required_skills = {
        "Python": 4,
    }

    user_skills = {
        "Python": 2,
    }

    result = calculate_match_score(required_skills, user_skills)

    assert result == 0.0


def test_match_score_three_of_four_skills_returns_75():
    """ตรง 3 ใน 4 skills → 75%"""
    required_skills = {
        "Python": 3,
        "Git": 2,
        "Docker": 2,
        "FastAPI": 2,
    }

    user_skills = {
        "Python": 3,
        "Git": 4,
        "Docker": 2,
    }

    result = calculate_match_score(required_skills, user_skills)

    assert result == 75.0


# ============================================================
# ERROR CASE
# ============================================================

def test_match_score_invalid_required_skill_level_raises_error():
    """required skill level ต้องอยู่ในช่วง 1-5"""
    required_skills = {
        "Python": 6,
    }

    user_skills = {
        "Python": 5,
    }

    with pytest.raises(ValueError):
        calculate_match_score(required_skills, user_skills)


def test_match_score_invalid_user_skill_level_raises_error():
    """user skill level ต้องอยู่ในช่วง 1-5"""
    required_skills = {
        "Python": 3,
    }

    user_skills = {
        "Python": 0,
    }

    with pytest.raises(ValueError):
        calculate_match_score(required_skills, user_skills)