"""Unit tests for legitimate, safe communications.
Verifies that genuine bank notifications, OTP alerts with defensive disclaimers,
delivery notifications, and routine conversations are correctly classified as LOW RISK.
"""

from ai_engine import analyze_message


def test_genuine_bank_debit_notification() -> None:
    msg = (
        "Dear Customer, your A/c *4589 is debited by Rs 1,450.00 on 21-Nov-26. "
        "Avl Bal: Rs 42,100.50. Txn ID: TXN987654321. Bank never asks for OTP."
    )
    result = analyze_message(msg)
    assert result["risk_level"] == "LOW", f"Expected LOW risk, got {result['risk_level']}"
    assert result["risk_score"] <= 30, f"Expected score <= 30, got {result['risk_score']}"
    assert result["scam_category"] is None, f"Expected no scam category for safe message, got {result['scam_category']}"


def test_genuine_login_otp_with_warning() -> None:
    msg = (
        "492810 is your login OTP for NetBanking. Valid for 5 minutes. "
        "Do not share your OTP with anyone, neither bank nor any official will call for OTP."
    )
    result = analyze_message(msg)
    assert result["risk_level"] == "LOW", f"Expected LOW risk, got {result['risk_level']}"
    assert result["risk_score"] <= 30


def test_ecommerce_delivery_notification() -> None:
    msg = (
        "Your order #ORD-98214 has been shipped with tracking ID DEL776512. "
        "Package is out for delivery today. Please collect from the delivery agent."
    )
    result = analyze_message(msg)
    assert result["risk_level"] == "LOW", f"Expected LOW risk, got {result['risk_level']}"
    assert result["risk_score"] == 0


def test_casual_personal_conversation() -> None:
    msg = "Hey Rahul, are we still meeting at Indiranagar metro station at 5 PM for the hackathon discussion?"
    result = analyze_message(msg)
    assert result["risk_level"] == "LOW", f"Expected LOW risk, got {result['risk_level']}"
    assert result["risk_score"] == 0


def test_empty_and_whitespace_input() -> None:
    result = analyze_message("   ")
    assert result["risk_level"] == "LOW"
    assert result["risk_score"] == 0
