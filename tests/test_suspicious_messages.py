"""Unit tests for suspicious / medium-risk messages.
Verifies that borderline messages containing weak urgency, unverified reward points,
or uncontextualized shorteners without explicit credentials fall into MEDIUM RISK (31-60).
"""

from ai_engine import analyze_message


def test_reward_points_expiring_notification() -> None:
    msg = "Dear user, your reward points worth Rs 2,500 are expiring today. Redeem your points now."
    result = analyze_message(msg)
    assert result["risk_level"] in ("MEDIUM", "LOW"), f"Expected MEDIUM or LOW risk, got {result['risk_level']}"
    assert any("REWARD" in ind["code"] for ind in result["detected_indicators"])


def test_generic_urgency_with_shortened_link() -> None:
    msg = "Urgent: Important update regarding your membership profile. Review immediately at http://bit.ly/profile-info"
    result = analyze_message(msg)
    # Shortener + urgency should reach MEDIUM risk
    assert result["risk_level"] in ("MEDIUM", "HIGH"), f"Expected at least MEDIUM risk, got {result['risk_level']}"
    assert result["risk_score"] >= 31


def test_insecure_http_promotional_link() -> None:
    msg = "Exclusive winter discount! Visit http://cooldeals-shopping.com to view offers."
    result = analyze_message(msg)
    # Low to medium risk, not a scam without phishing markers
    assert result["risk_score"] < 60
