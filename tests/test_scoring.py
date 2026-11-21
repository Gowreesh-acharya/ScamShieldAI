"""Unit tests for the Risk Scoring Engine and Explainability.
Validates score bounds [0, 100], risk classifications, non-double-counting,
and completeness of output contracts for FastAPI.
"""

from ai_engine import DetectionEngine, analyze_input
from ai_engine.models import Indicator, IndicatorSeverity, RiskLevel
from ai_engine.scoring.risk_scorer import RiskScorer


def test_score_boundaries_and_clamping() -> None:
    scorer = RiskScorer()

    # Empty indicators must yield 0 and LOW risk
    s0, r0, v0 = scorer.calculate_score([])
    assert s0 == 0
    assert r0 == RiskLevel.LOW

    # Single low indicator
    ind_low = Indicator(
        code="TEST_LOW",
        title="Test Low",
        severity=IndicatorSeverity.LOW,
        matched_text="test",
        description="test",
    )
    s1, r1, v1 = scorer.calculate_score([ind_low])
    assert s1 == 10
    assert r1 == RiskLevel.LOW

    # Overwhelming number of critical indicators must never exceed 100
    crit_inds = [
        Indicator(
            code=f"CRIT_{i}",
            title=f"Crit {i}",
            severity=IndicatorSeverity.CRITICAL,
            matched_text="crit",
            description="crit",
        )
        for i in range(10)
    ]
    s_max, r_max, v_max = scorer.calculate_score(crit_inds)
    assert s_max == 100
    assert r_max == RiskLevel.HIGH


def test_no_double_counting_for_duplicate_codes() -> None:
    scorer = RiskScorer()
    dup_ind = Indicator(
        code="DUP_CODE",
        title="Duplicate",
        severity=IndicatorSeverity.HIGH,
        matched_text="match1",
        description="desc",
    )
    dup_ind_2 = Indicator(
        code="DUP_CODE",
        title="Duplicate",
        severity=IndicatorSeverity.HIGH,
        matched_text="match2",
        description="desc",
    )
    score, _, _ = scorer.calculate_score([dup_ind, dup_ind_2])
    # Weight of HIGH is 40. Should be counted exactly once!
    assert score == 40


def test_contract_keys_for_fastapi() -> None:
    engine = DetectionEngine()
    result = engine.analyze_message("Your account is blocked today. Complete KYC at http://bit.ly/kyc")
    
    expected_keys = {
        "input_type",
        "analyzed_target",
        "risk_score",
        "risk_level",
        "verdict",
        "scam_category",
        "detected_indicators",
        "explanation",
        "recommendations",
        "urls_found",
        "url_details",
        "disclaimer",
    }
    assert expected_keys.issubset(set(result.keys())), f"Missing keys in contract: {expected_keys - set(result.keys())}"
    assert isinstance(result["risk_score"], int)
    assert result["risk_level"] in ("LOW", "MEDIUM", "HIGH")
    assert isinstance(result["recommendations"], list)
    assert len(result["recommendations"]) > 0


def test_analyze_input_auto_routing() -> None:
    # URL auto routing
    res_url = analyze_input("http://192.168.1.1/login")
    assert res_url["input_type"] == "url"

    # Message auto routing
    res_msg = analyze_input("Dear customer, please check your monthly account statement.")
    assert res_msg["input_type"] == "message"
